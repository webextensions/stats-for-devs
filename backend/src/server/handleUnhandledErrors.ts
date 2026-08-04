const errorHandler = function (err, errType) {
    console.error(`Fatal Error: ${errType} occurred!`);
    console.error('Error:', err);
    console.error('Error stack:', err.stack);

    // Exiting manually because "pm2" might be catching the uncaught exception and not letting the process end
    // https://github.com/Unitech/pm2/issues/5409
    // https://github.com/keymetrics/pm2-io-apm/blob/b6b1bd776c8b147a396be1c095766d908d05775a/src/features/notify.ts#L191
    console.error('Exiting with error code 1');

    process.exit(1); // eslint-disable-line n/no-process-exit
};

const handleUnhandledErrors = function () {
    process.on('unhandledRejection', function (err) {
        errorHandler(err, 'unhandledRejection');
    });
    process.on('uncaughtException', function (err) {
        errorHandler(err, 'uncaughtException');
    });
};

export { handleUnhandledErrors };
