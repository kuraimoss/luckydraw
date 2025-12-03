'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Path = require('path');

let participants = []; // disimpan di memori

async function init() {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    routes: {
      cors: true,
      files: {
        relativeTo: Path.join(__dirname, 'public'),
      },
    },
  });

  await server.register(Inert);

  // GET semua peserta
  server.route({
    method: 'GET',
    path: '/api/participants',
    handler: (request, h) => {
      return h.response({
        status: 'success',
        data: { participants },
      });
    },
  });

  // Tambah 1 peserta
  server.route({
    method: 'POST',
    path: '/api/participants',
    handler: (request, h) => {
      const payload = request.payload || {};
      const name = (payload.name || '').toString().trim();

      if (!name) {
        return h
          .response({
            status: 'fail',
            message: 'Nama peserta wajib diisi.',
          })
          .code(400);
      }

      const id =
        Date.now().toString(36) +
        '-' +
        Math.random().toString(36).slice(2, 8);

      const participant = { id, name };
      participants.push(participant);

      return h
        .response({
          status: 'success',
          data: {
            participant,
            participants,
          },
        })
        .code(201);
    },
  });

  // Tambah banyak peserta sekaligus
  server.route({
    method: 'POST',
    path: '/api/participants/bulk',
    handler: (request, h) => {
      const payload = request.payload || {};
      const names = Array.isArray(payload.names) ? payload.names : [];

      const added = [];
      for (let raw of names) {
        const name = (raw || '').toString().trim();
        if (!name) continue;
        const id =
          Date.now().toString(36) +
          '-' +
          Math.random().toString(36).slice(2, 8);
        const participant = { id, name };
        participants.push(participant);
        added.push(participant);
      }

      if (!added.length) {
        return h
          .response({
            status: 'fail',
            message: 'Tidak ada nama valid yang dikirim.',
          })
          .code(400);
      }

      return h.response({
        status: 'success',
        data: {
          addedCount: added.length,
          participants,
        },
      });
    },
  });

  // Hapus 1 peserta
  server.route({
    method: 'DELETE',
    path: '/api/participants/{id}',
    handler: (request, h) => {
      const { id } = request.params;
      const index = participants.findIndex((p) => p.id === id);

      if (index === -1) {
        return h
          .response({
            status: 'fail',
            message: 'Peserta tidak ditemukan.',
          })
          .code(404);
      }

      const removed = participants.splice(index, 1)[0];

      return h.response({
        status: 'success',
        data: {
          removed,
          participants,
        },
      });
    },
  });

  // Hapus semua peserta
  server.route({
    method: 'DELETE',
    path: '/api/participants',
    handler: (request, h) => {
      participants = [];
      return h.response({
        status: 'success',
        data: { participants },
      });
    },
  });

  // Hapus peserta berdasarkan nama (untuk winner removal)
  server.route({
    method: 'DELETE',
    path: '/api/participants/by-name',
    handler: (request, h) => {
      const payload = request.payload || {};
      const name = (payload.name || '').toString().trim();

      if (!name) {
        return h
          .response({
            status: 'fail',
            message: 'Nama peserta wajib diisi.',
          })
          .code(400);
      }

      const index = participants.findIndex((p) => p.name === name);

      if (index === -1) {
        return h
          .response({
            status: 'fail',
            message: 'Peserta tidak ditemukan.',
          })
          .code(404);
      }

      const removed = participants.splice(index, 1)[0];

      return h.response({
        status: 'success',
        data: {
          removed,
          participants,
        },
      });
    },
  });

  // Spin random (random name picker)
  server.route({
    method: 'POST',
    path: '/api/spin',
    handler: (request, h) => {
      if (!participants.length) {
        return h
          .response({
            status: 'fail',
            message: 'Belum ada peserta.',
          })
          .code(400);
      }

      if (participants.length < 2) {
        return h
          .response({
            status: 'fail',
            message: 'Minimal 2 peserta untuk spin.',
          })
          .code(400);
      }

      const winnerIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[winnerIndex];

      return h.response({
        status: 'success',
        data: {
          participants,
          winnerIndex,
          winner,
        },
      });
    },
  });

  // Halaman utama
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.file('index.html');
    },
  });

  // Static files
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        index: ['index.html'],
      },
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
}

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
