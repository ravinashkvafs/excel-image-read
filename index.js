const fs = require("fs");
const JSZip = require('jszip');
const async = require('async');
const Jimp = require('jimp');
const { execFile } = require('child_process');
const jpegRecompress = require('jpeg-recompress-bin');
const FileType = require('file-type');

const getMimetype = (signature) => {
    switch (signature) {
        case '89504E47':
            return 'image/png'
        case '47494638':
            return 'image/gif'
        case '25504446':
            return 'application/pdf'
        case 'FFD8FFDB':
        case 'FFD8FFE0':
        case 'FFD8FFE1':
            return 'image/jpeg'
        case '504B0304':
            return 'application/zip'
        default:
            return 'Unknown filetype'
    }
}

function bufferToFileType(buffer) {
    const uint = new Uint8Array(buffer.slice(0, 4));
    let bytes = [];
    uint.forEach((byte) => {
        bytes.push(byte.toString(16));
    })
    const hex = bytes.join('').toUpperCase();
    return getMimetype(hex);
}

fs.readFile("test.xlsx", function (err, data) {
    if (err) return console.log(err);

    const zip = new JSZip();

    zip.loadAsync(data)
        .then(function (zip) {

            async.eachSeries(Object.keys(zip['files']), (k, cb) => {

                // Checking whether a media file or not
                if (!k.includes('xl/media')) return cb();

                let filename = k.split('/');
                filename = filename[filename.length - 1];

                if (!filename) return cb();

                // Fetching buffer value of media
                const buffer = zip['files'][k]['_data']['compressedContent'];
                const base4_str = `data:image/jpeg;base64,${buffer.toString('base64')}`;
                // const base4_str = buffer.toString('base64');



                console.log(buffer, bufferToFileType(buffer));

                // return cb();

                // Method 1

                // // open the file in writing mode, adding a callback function where we do the actual writing
                // fs.open(`./media/${filename}`, 'w', function (err, fd) {
                //     if (err) return cb(err);

                //     // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
                //     fs.write(fd, buffer, 0, buffer.length, null, function (err) {
                //         if (err) return cb(err);

                //         fs.close(fd, function () {
                //             console.log(`wrote ${filename} successfully`);
                //             return cb();
                //         });
                //     });

                // });

                // Method 2

                // Jimp.read(buffer)
                //     .then(image => {
                //         // Do stuff with the image.
                //         console.log(image);
                //         image.write(`./media/${filename}`);
                //         return cb();
                //     })
                //     .catch(err => {
                //         // Handle an exception.
                //         return cb(err);
                //     });

                // Method 3

                fs.writeFile(`./media/${filename}`, base4_str, { encoding: 'base64' }, async function (err) {
                    if (err) return cb(err);

                    console.log(await FileType.fromBuffer(buffer));

                    console.log('File created');
                    return cb();

                });

                // return cb();

            }, (er) => {
                console.log(er, 'DONE')
            });

        });
});