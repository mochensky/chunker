//! Debug tool: block-by-block comparison of the same chunks in two worlds.

use std::path::Path;

use anyhow::{Context, Result};
use chunker_anvil::{Region, RegionPos, local_index};
use chunker_nbt::{Compound, Tag};

/// Decodes a block state palette entry (26.x string / `{id, properties}` / wrapped `{"": id}`).
fn entry_name(tag: &Tag) -> String {
    match tag {
        Tag::String(s) => s.clone(),
        Tag::Compound(c) => {
            if let Some(Tag::String(s)) = c.get("") {
                return s.clone();
            }
            let id = c
                .get_str("id")
                .or_else(|| c.get_str("Name"))
                .unwrap_or("?")
                .to_owned();
            let props = c
                .get_compound("properties")
                .or_else(|| c.get_compound("Properties"));
            match props {
                Some(p) if !p.is_empty() => {
                    let mut kv: Vec<String> = p
                        .iter()
                        .map(|(k, v)| format!("{k}={}", v.as_str().unwrap_or("?")))
                        .collect();
                    kv.sort();
                    format!("{id}[{}]", kv.join(","))
                }
                _ => id,
            }
        }
        _ => "?".into(),
    }
}

/// All 16x16x16 block names of each section, keyed by section Y.
fn decode_blocks(chunk: &Compound) -> Vec<(i8, Vec<String>)> {
    let mut out = Vec::new();
    let Some(sections) = chunk.get_list("sections") else {
        return out;
    };
    for s in sections.compounds() {
        let y = s.get_i32("Y").unwrap_or(0) as i8;
        let Some(bs) = s.get_compound("block_states") else {
            continue;
        };
        let palette: Vec<String> = bs
            .get_list("palette")
            .map(|l| l.iter().map(entry_name).collect())
            .unwrap_or_default();
        let mut blocks = vec![String::new(); 4096];
        match bs.get_long_array("data") {
            None => blocks
                .iter_mut()
                .for_each(|b| *b = palette.first().cloned().unwrap_or_default()),
            Some(data) => {
                let bits = (64 - (palette.len().max(2) - 1).leading_zeros()).max(4) as usize;
                let per_long = 64 / bits;
                for (i, b) in blocks.iter_mut().enumerate() {
                    let v = ((data[i / per_long] as u64) >> ((i % per_long) * bits)) & ((1u64 << bits) - 1);
                    *b = palette.get(v as usize).cloned().unwrap_or_else(|| "?".into());
                }
            }
        }
        out.push((y, blocks));
    }
    out
}

fn load(world_region_dir: &Path, cx: i32, cz: i32) -> Result<Option<Compound>> {
    let region = Region::load(world_region_dir, RegionPos::of_chunk(cx, cz))?;
    region
        .get(local_index(cx, cz))
        .map(|r| r.decode_nbt())
        .transpose()
        .map_err(Into::into)
}

pub fn compare(a_dir: &Path, b_dir: &Path, from: (i32, i32), to: (i32, i32), verbose: usize) -> Result<()> {
    let mut total_diff = 0usize;
    let mut chunks = 0usize;
    let mut identical = 0usize;
    for cz in from.1..=to.1 {
        for cx in from.0..=to.0 {
            let (Some(a), Some(b)) = (load(a_dir, cx, cz)?, load(b_dir, cx, cz)?) else {
                println!("chunk {cx},{cz}: missing in one world");
                continue;
            };
            chunks += 1;
            let (sa, sb) = (decode_blocks(&a), decode_blocks(&b));
            let mut diff = 0usize;
            let mut samples: Vec<String> = Vec::new();
            for (y, blocks_a) in &sa {
                let Some((_, blocks_b)) = sb.iter().find(|(yb, _)| yb == y) else {
                    continue;
                };
                for i in 0..4096 {
                    if blocks_a[i] != blocks_b[i] {
                        diff += 1;
                        if samples.len() < verbose {
                            let (x, yy, z) = (i & 15, (i >> 8) & 15, (i >> 4) & 15);
                            samples.push(format!(
                                "  ({}, {}, {}): {} vs {}",
                                (cx << 4) + x as i32,
                                (*y as i32) * 16 + yy as i32,
                                (cz << 4) + z as i32,
                                blocks_a[i],
                                blocks_b[i]
                            ));
                        }
                    }
                }
            }
            total_diff += diff;
            if diff == 0 {
                identical += 1;
            } else {
                println!(
                    "chunk {cx},{cz}: {diff} differing blocks (status {} vs {})",
                    a.get_str("Status").unwrap_or("?"),
                    b.get_str("Status").unwrap_or("?")
                );
                for s in samples {
                    println!("{s}");
                }
            }
        }
    }
    println!("compared {chunks} chunks: {identical} identical, {total_diff} differing blocks in total");
    Ok(())
}

pub fn region_dir_of(world: &Path, dimension: &str) -> Result<std::path::PathBuf> {
    let id = chunker_data::Identifier::parse(dimension).context("bad dimension")?;
    Ok(world
        .join("dimensions")
        .join(id.namespace())
        .join(id.path())
        .join("region"))
}
