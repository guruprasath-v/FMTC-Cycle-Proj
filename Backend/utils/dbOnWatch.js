const { realTimeDb } = require('../confs/dbConfig');
const cycleController = require('../controllers/cycleController');

function dbOnWatch() {
    const cyclesRef = realTimeDb.ref('CYCLE_UNLOCK');

    cyclesRef.on('value', (snapshot) => {
        setTimeout(async () => { // Use setTimeout inside the callback
            console.log(`After 5 seconds...`);
            const data = snapshot.val();
            console.log(`data_changed: ${JSON.stringify(data, null, 2)}`); // Pretty-print JSON
            if (data.CYCLE_STATUS === "LOCKED") {
                await cycleController.lockCycle(data.CYCLE_ID, data.STAND_ID, data.SLOT_ID);
            }
        }, 5000);
    });
}

module.exports = dbOnWatch;
