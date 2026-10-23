# Game scene art

The art pack is sized around the packaged 1920×1080 game viewport.

- `field/`: 512×512 tile textures for empty ground, monster, mana, and treasure.
- `world-tree/`: ten 1920×1080 growth stages, from a nearly dead sapling to the fully restored World Tree. Stage 5 has a wider canopy to keep the tree's growth visually continuous.
- `ranch/`: 1920×1080 barn background with a clear center floor for the active monster.
- `battle/`: eight 1920×660 panoramic battle backgrounds. `normal-*` are regular stages; `boss-*` are boss arenas.

At 1920×1080, the shared header and all current tabs fit in one viewport. The field and ranch use the expanded desktop canvas; the ranch monster scene fills unused card space. Battle scenes select a normal or boss backdrop and hold it for five stages; the next image is decoded asynchronously before it replaces the current one. Narrower screens keep a fluid layout and may scroll vertically, without horizontal overflow.
