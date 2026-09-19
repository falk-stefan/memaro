import {readdir} from "node:fs/promises";
import path from "node:path";
import {sequelizeClient} from "../db/sequelize.js";
import {InstructionDocEntity} from "../db/table/instruction-doc.entity.js";
import {LocalDirectorySource} from "../ingestion/local-directory.source.js";
import {loadMemaroConfig} from "../ingestion/memaro-config.js";

/**
 * Scans `data/<source-name>/` for every source directory, syncing each file
 * into `instruction_doc` via the local directory adapter. Content-hash based:
 * unchanged files are skipped, changed files are updated, removed files are
 * retired. Does not touch Qdrant — vector population is Iteration 3's job,
 * once embed() is swapped to the 768-dim model the `instruction` collection
 * is already sized for.
 */

const DATA_DIR = path.resolve(process.cwd(), process.env.MEMARO_DATA_DIR ?? 'data');
const DEFAULT_SCOPE = 'org';

async function listSourceDirs(dataDir: string): Promise<string[]> {
    try {
        const entries = await readdir(dataDir, {withFileTypes: true});
        return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function syncSource(sourceName: string): Promise<void> {
    const sourceDir = path.join(DATA_DIR, sourceName);
    const config = await loadMemaroConfig(sourceDir);
    const source = new LocalDirectorySource(sourceDir, sourceName);

    const seenPaths = new Set<string>();
    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for await (const doc of source.listDocuments()) {
        seenPaths.add(doc.externalId);

        const existing = await InstructionDocEntity.findOne({
            where: {sourceId: source.id, sourcePath: doc.externalId},
        });

        const shared = {
            title: doc.title,
            body: doc.content,
            contextTags: doc.tags ?? [],
            scope: doc.scope ?? config.scope ?? DEFAULT_SCOPE,
            owner: doc.owner ?? null,
            sourceUrl: doc.sourceUrl,
            contentHash: doc.contentHash,
        };

        if (!existing) {
            await InstructionDocEntity.create({
                ...shared,
                lastReviewed: null,
                sourceId: source.id,
                sourcePath: doc.externalId,
                acl: doc.acl,
            });
            created++;
            continue;
        }

        if (existing.contentHash === doc.contentHash) {
            unchanged++;
            continue;
        }

        await existing.update(shared);
        updated++;
    }

    const existingRows = await InstructionDocEntity.findAll({where: {sourceId: source.id}});
    let removed = 0;
    for (const row of existingRows) {
        if (!seenPaths.has(row.sourcePath)) {
            await row.destroy();
            removed++;
        }
    }

    console.log(`[${source.id}] created=${created} updated=${updated} unchanged=${unchanged} removed=${removed}`);
}

async function main(): Promise<void> {
    await sequelizeClient.sync();

    const sourceNames = await listSourceDirs(DATA_DIR);

    if (sourceNames.length === 0) {
        console.log(`No sources found under ${DATA_DIR} — nothing to do.`);
        return;
    }

    for (const sourceName of sourceNames) {
        await syncSource(sourceName);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Fatal error while ingesting:", error);
        process.exit(1);
    });
