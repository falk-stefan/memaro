import {randomUUID} from "node:crypto";
import {readdir} from "node:fs/promises";
import path from "node:path";
import {sequelizeClient} from "../db/sequelize.js";
import {qdrantClient} from "../db/qdrant.js";
import {InstructionDocEntity} from "../db/table/instruction-doc.entity.js";
import {LocalDirectorySource} from "../ingestion/local-directory.source.js";
import {loadMemaroConfig} from "../ingestion/memaro-config.js";
import {chunkDocument} from "../ingestion/chunking.js";
import {embedDocument} from "../service/embedding.service.js";

/**
 * Scans `data/<source-name>/` for every source directory, syncing each file
 * into `instruction_doc` via the local directory adapter, and into vectors
 * in the `instruction` Qdrant collection. Content-hash based: unchanged
 * files are skipped entirely (no re-embedding), changed files have their
 * chunks replaced, removed files have their row and chunks retired.
 */

const deleteChunks = async (docId: string): Promise<void> => {
    await qdrantClient.delete('instruction', {
        wait: true,
        filter: {must: [{key: 'docId', match: {value: Number(docId)}}]},
    });
};

const indexChunks = async (doc: InstructionDocEntity): Promise<void> => {
    const chunks = chunkDocument(doc.body);

    if (chunks.length === 0) {
        return;
    }

    const points = await Promise.all(chunks.map(async (chunk, index) => ({
        id: randomUUID(),
        vector: await embedDocument(chunk.embeddingText),
        payload: {
            docId: Number(doc.id),
            chunkIndex: index,
            headingPath: chunk.headingPath,
            text: chunk.text,
            title: doc.title,
            contextTags: doc.contextTags,
            scope: doc.scope,
            owner: doc.owner,
            sourceUrl: doc.sourceUrl,
        },
    })));

    await qdrantClient.upsert('instruction', {wait: true, points});
};

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
            const createdDoc = await InstructionDocEntity.create({
                ...shared,
                lastReviewed: null,
                sourceId: source.id,
                sourcePath: doc.externalId,
                acl: doc.acl,
            });
            await indexChunks(createdDoc);
            created++;
            continue;
        }

        if (existing.contentHash === doc.contentHash) {
            unchanged++;
            continue;
        }

        await existing.update(shared);
        await deleteChunks(existing.id);
        await indexChunks(existing);
        updated++;
    }

    const existingRows = await InstructionDocEntity.findAll({where: {sourceId: source.id}});
    let removed = 0;
    for (const row of existingRows) {
        if (!seenPaths.has(row.sourcePath)) {
            await deleteChunks(row.id);
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
