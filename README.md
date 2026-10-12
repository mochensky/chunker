# chunker

A fast pre-generator for Minecraft: Java Edition worlds, with a web interface.

## Documentation:
 - ### [English](README/en/README.md)
 - ### [Русский](README/ru/README.md)

## Overview

chunker generates the chunks of a server or single-player world ahead of time, so that players do not wait for terrain and the server does not spend its ticks on generation. It produces the same chunks as the vanilla server, block for block: terrain, structures, trees, ores and the mobs that structures place. On a modern desktop CPU it generates more than a thousand chunks per second, while the server and Chunky usually manage 100–300.

You choose the area on a live map in the browser, start the task and follow its progress. This works the same on a home computer and on a VPS or hosting.

Supported version: Minecraft 26.3. Generation is done by the [chunker-worldgen](https://github.com/mochensky/chunker-worldgen) library.

## Quick start

Download the binary for your OS from the [releases page](https://github.com/mochensky/chunker/releases/latest), stop the Minecraft server, put the binary into the server folder and run it:

```bash
chmod +x chunker-linux-amd64
./chunker-linux-amd64
```

The program prints a link with an access token. Open it in the browser, choose the area and start the generation.

Or build it from source:

```bash
git clone https://github.com/mochensky/chunker
cd chunker
cargo build --release
```

See the full guide in the documentation linked above.

## License

MIT or Apache-2.0, at your option.

Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
