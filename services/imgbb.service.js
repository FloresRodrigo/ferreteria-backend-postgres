const axios = require('axios');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

async function subirImagen(buffer) {
    try {
        const base64Image = buffer.toString('base64');
        const form = new URLSearchParams();
        form.append('image', base64Image);
        const response = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, form);
        if(response.data && response.data.success) {
            return response.data.data.url;
        };
        throw new Error('Error al subir la imagen a ImgBB');
    } catch (err) {
        throw err;
    };
}

module.exports = { subirImagen };