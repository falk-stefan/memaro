import {pipeline, Tensor} from '@huggingface/transformers'

const generator = await pipeline(
    'feature-extraction',
    // sentence-transformers/all-MiniLM-L6-v2 ndims=384
    'sentence-transformers/all-MiniLM-L6-v2'
);

export const embed = async (text: string) => {

    const result: Tensor = await generator(text, {
        pooling: 'mean',
        normalize: true,
    });

    return result.tolist()[0];
}


const embedCheap = async (text: string, dim: number = 64) => {
    const vector = new Array(dim).fill(0);

    for (let i = 0; i < text.length; i++) {
        vector[i % dim] += text.charCodeAt(i);
    }

    return vector.map(v => v / text.length);
};