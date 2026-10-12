# chunker

A fast pre-generator for Minecraft: Java Edition worlds, with a web interface. It generates the chunks of a server or single-player world ahead of time, so that players do not wait for terrain and the server does not spend its ticks on generation.

Supported version: **Minecraft 26.3**.

## Features

- **Same chunks as vanilla** — terrain, caves, ores, trees, every structure and the mobs that structures place (villagers, piglins, drowned and the rest, with their equipment) are generated block for block like the vanilla server does. Generation is done by the [chunker-worldgen](https://github.com/mochensky/chunker-worldgen) library, which is checked against the real server classes.
- **Speed** — more than a thousand chunks per second on a modern desktop CPU, with every core in use. The server and Chunky usually generate 100–300 chunks per second.
- **Web interface** — a live map of the world (terrain and biomes), the area chosen with the mouse, progress, speed and remaining time. Works the same on a home computer and on a VPS or hosting.
- **Any area** — a square, a circle or a rectangle around any point, in the Overworld, the Nether or the End.
- **Size estimate** — the number of chunks, the disk space and the time before you start; the disk space is measured on sample chunks of the chosen area.
- **Pause and resume** — a task can be paused, resumed and cancelled. It also continues after the program is restarted.
- **Existing chunks are kept** — chunks that are already generated are never overwritten.
- **Terrain only mode** — about a third faster; the server then places structures and features when the chunks first load.
- **Data packs** — the world's data packs are taken into account, in the order of `level.dat`.
- **Safe for the world** — chunker locks the world (`session.lock`) like the server does, and refuses to run while the server is running.
- **Single file** — one binary without dependencies. The vanilla server jar with the game data is found in the server folder or downloaded from Mojang.
- **Russian and English** — the interface language can be switched.

## Requirements

- A Minecraft 26.3 world: a server folder or a single-player world folder. The world must be created first (start the server once).
- The server must be stopped while chunker generates.
- Internet access on the first run if the server folder has no server jar (it is downloaded from Mojang, about 60 MB).
- Rust 1.90+ (only when building from source; not needed for the pre-built binaries).

## Installation

### Option 1: Download a pre-built binary (recommended)

Go to the [releases page](https://github.com/mochensky/chunker/releases/latest) and download the binary for your OS:

- `chunker-windows-amd64.exe` — Windows
- `chunker-linux-amd64` — Linux (x86-64)
- `chunker-linux-arm64` — Linux (ARM64)
- `chunker-macos-arm64` — macOS (Apple Silicon)

The Linux binaries are static and run on any distribution.

### Option 2: Build from source

```bash
git clone https://github.com/mochensky/chunker
cd chunker
cargo build --release
```

The binary is `target/release/chunker` (`chunker.exe` on Windows).

## Getting started

### Step 1: Stop the server

chunker writes the region files of the world directly, so the server must not run at the same time. If the server is running, chunker shows it and does not start the generation.

### Step 2: Run chunker in the server folder

Put the binary into the server folder (where `server.properties` is) or into a world folder (where `level.dat` is) and run it.

**Linux:**

```bash
chmod +x chunker-linux-amd64
./chunker-linux-amd64
```

**Windows:** run it from the command line, so that the window stays open and you can see the link:

```cmd
cd C:\path\to\server
chunker-windows-amd64.exe
```

You can also start it anywhere and give the folder explicitly: `chunker --path /path/to/server`. Without a folder, the web interface lets you choose a world: it lists the worlds it finds nearby and in `.minecraft/saves`, and has a folder browser.

On start you will see:

```
INFO chunker::web: web UI: http://localhost:8730/?token=3f9c1a...
```

### Step 3: Open the web interface

Open the link in the browser. On a VPS replace `localhost` with the address of the server. The token in the link signs you in; the browser remembers it.

### Step 4: Choose the area and start

1. Choose the dimension.
2. Click the map to place the center, or type the coordinates.
3. Set the radius, or choose a preset. Drag the outline on the map to resize it. Shift + drag draws a rectangle.
4. Choose what to generate: everything, or terrain only.
5. Check the estimate (chunks, disk space, time) and press **Start generation**.

The map shows the generated chunks while the task runs. When it is finished, start the server: players will find the generated area ready.

## Command line

The web interface is the default command. Generation also works without it:

```bash
# A square of 2048x2048 blocks around 0,0 in the Overworld
chunker --path /path/to/server generate --radius 1024

# A circle in the Nether around a point
chunker --path /path/to/server generate --dimension minecraft:the_nether --center 500,-200 --radius 512 --shape circle

# A rectangle: 1024 blocks to each side along X, 256 along Z
chunker --path /path/to/server generate --shape rectangle --radius 1024 --radius-z 256

# Terrain only
chunker --path /path/to/server generate --radius 1024 --terrain-only

# Information about the world
chunker --path /path/to/server info
```

In the web interface an unfinished task is continued with the **Resume** button, also after a restart. On the command line, run the same `generate` again: chunks that are already saved are skipped.

### Options

| Option | Description |
|---|---|
| `-p, --path <folder>` | server folder or world folder (default: the current folder) |
| `--server-jar <file>` | the server jar to read the game data from (vanilla, bundler or Paper's `cache/mojang_*.jar`) |
| `--cache-dir <folder>` | where the downloaded server jar and the access token are kept |
| `--offline` | never download the server jar |

`serve` (the web interface):

| Option | Description |
|---|---|
| `--host <address>` | address to listen on (default `0.0.0.0`; `127.0.0.1` allows local access only) |
| `--port <port>` | port (default `8730`) |
| `--token <token>` | access token (also the `CHUNKER_TOKEN` variable); random if not set |
| `--no-auth` | no token; only for a trusted network |

`generate`:

| Option | Description |
|---|---|
| `--dimension <id>` | `minecraft:overworld` (default), `minecraft:the_nether`, `minecraft:the_end` |
| `--center <X,Z>` | center in blocks (default `0,0`) |
| `--radius <blocks>` | radius in blocks; along X for a rectangle |
| `--radius-z <blocks>` | radius along Z of a rectangle |
| `--shape <shape>` | `square` (default), `circle` or `rectangle` |
| `--threads <n>` | worker threads, `0` for all CPUs (default) |
| `--terrain-only` | only terrain; the server places structures and features later |

## Access token

The web interface asks for a token. It is printed at start in the link `/?token=...`. If `--token` is not set, chunker creates a random token once and keeps it in the cache folder, so it does not change between runs:

- Windows: `%LOCALAPPDATA%\chunker\token`
- Linux and macOS: `~/.cache/chunker/token` (or `$XDG_CACHE_HOME/chunker/token`)

> **Important:** anyone with the token can start a generation in your world. Do not publish the link. On a VPS you can also listen on `127.0.0.1` only and open the interface through an SSH tunnel: `ssh -L 8730:127.0.0.1:8730 user@your-server`.

## Deploying on a VPS / server

### 1. Upload the binary to the server

```bash
scp chunker-linux-amd64 user@your-server:/opt/minecraft/
ssh user@your-server
chmod +x /opt/minecraft/chunker-linux-amd64
```

### 2. Stop the Minecraft server and run chunker

```bash
cd /opt/minecraft
./chunker-linux-amd64
```

Open the printed link with the address of your server. Open port `8730` in the firewall if it is closed, or use the SSH tunnel from the section above.

### 3. Keep it running after the SSH session ends (optional)

A task keeps running only while chunker runs. To close the SSH session during a long generation, run chunker in `screen` or `tmux`, or as a systemd service. Create `/etc/systemd/system/chunker.service`:

```ini
[Unit]
Description=chunker
After=network.target

[Service]
Type=simple
User=minecraft
WorkingDirectory=/opt/minecraft
ExecStart=/opt/minecraft/chunker-linux-amd64 --path /opt/minecraft
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start chunker
sudo journalctl -u chunker -f
```

Stop it with `sudo systemctl stop chunker` before you start the Minecraft server.

## How it works

- chunker reads `level.dat`, the world generation settings and the data packs of the world, and the game data from the vanilla server jar.
- Chunks are generated region by region, nearest to the center first, on all CPU cores.
- Generated chunks are saved with the `features` status: terrain, structures and features are complete. When the server loads them, it only adds light and the first animals, like it does after its own generation.
- Progress is saved in `<world>/.chunker/job.json`, map previews in `<world>/.chunker/preview/`. The folder can be deleted after the generation.

## Project structure

```
├── crates/chunker/
│   ├── src/
│   │   ├── main.rs        — command line
│   │   ├── web.rs         — web server and its API
│   │   ├── discover.rs    — finding worlds on the computer
│   │   └── compare.rs     — comparing two worlds (debugging)
│   └── web/               — the web interface (HTML, CSS, JavaScript), built into the binary
└── .github/workflows/     — checks and release builds
```

## License

MIT or Apache-2.0, at your option. See [LICENSE-MIT](../../LICENSE-MIT) and [LICENSE-APACHE](../../LICENSE-APACHE).

Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
