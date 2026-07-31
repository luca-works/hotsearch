import { readdir, unlink } from 'node:fs/promises';

const cleanDirectory = async (directory) => {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  await Promise.all(entries.map(async (entry) => {
    const target = new URL(entry.name, directory);
    if (entry.isDirectory()) {
      await cleanDirectory(new URL(`${entry.name}/`, directory));
    } else if (entry.name === '.DS_Store') {
      await unlink(target);
    }
  }));
};

await cleanDirectory(new URL('../.next/', import.meta.url));

