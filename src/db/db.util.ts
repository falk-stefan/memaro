
import {Transactionable} from "sequelize/lib/model";
import {sequelizeClient} from "./sequelize.js";
import {Transaction} from "sequelize";


type TransactionCallback<T> = (options: { transaction: Transaction }) => Promise<T>;

/**
 * Wraps a callback in a transaction.
 * @param callback The callback to wrap.
 */
export const withTransaction = async <T>(
    callback: TransactionCallback<T>
): Promise<T> => {
    const transaction = await sequelizeClient.transaction();
    try {
        const result = await callback({ transaction });
        await transaction.commit();
        return result;
    } catch (e) {
        await transaction.rollback();
        throw e;
    }
};