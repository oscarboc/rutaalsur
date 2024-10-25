const { BigBatch } = require("@qualdesk/firestore-big-batch");
var admin = require("firebase-admin");

var serviceAccount = require("../service_key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const fs = admin.firestore();


const getCollection = async (collectionName, prop) => {


    const collectionRef = fs.collection(collectionName).orderBy(prop);
    const snapshot = await collectionRef.get();

    if (!snapshot) {
        return [];
    } else {
        let data = [];
        snapshot.forEach(doc => {

            data.push(doc.data());
        });
        return data;
    }



}

const clearCollection = async (collectionName) => {

    const snapshot = await fs.collection(collectionName).get();

    const batchSize = snapshot.size;

    const cycles = parseInt(batchSize / 500) + 1;

    for (let i = 1; i <= cycles; i++) {

        await deleteCollection(fs, collectionName, 500);
    }

}



const importData = async (data, collectionName, io, prop, filename) => {

    try {
        let recordsCount = 0;

        const batch = new BigBatch({ firestore: fs }) // <--------- change this

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            let progress = (i + 1) * 100 / data.length;

            const ref = fs.collection(collectionName).doc(item[prop]);
            batch.set(ref, item);

            await io.sockets.emit('notification', { action: `Sincronizando ${i + 1} de ${data.length} ...${collectionName}` });
            await io.sockets.emit('progress', { action: progress.toFixed(0) });

            recordsCount++;
        }

        await batch.commit();

        await io.sockets.emit('notification', { action: `Sincronización de datos finalizada.` });
        setTimeout(async () => {
            await io.sockets.emit('notification', { action: `OK` });
        }, 2000)

        await uploadLastUpdate(collectionName, filename, recordsCount);

        return recordsCount;

    } catch (e) {
        console.log('Error al sincronizar en base de datos:', e);
        throw new Error(`Error al sincronizar en base de datos: ${e}`);
    }
}

async function deleteCollection(db, collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('consec').limit(batchSize);


    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}


async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    //const batch = db.batch();
    const batch = new BigBatch({ fs: fs });
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

async function uploadLastUpdate(collectionName, fileName, recordsCount) {

    const currentDate = admin.firestore.Timestamp.now();

    const data = {
        fileName,
        currentDate,
        recordsCount
    };

    try {
        const res = fs.collection(`${collectionName}UpdatesLog`).doc();
        await res.set(data);
    } catch (error) {
        console.log(`Error al sincronizar en base de datos: ${error}`);
        throw new Error(`Error al sincronizar en base de datos: ${error.details}`);
    }
}

module.exports = { getCollection, clearCollection, importData, uploadLastUpdate };