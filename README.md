# Kalkulator Bantuan Perubatan

Aplikasi web mobile-first untuk mengira cadangan bantuan perubatan MAIWP bagi susu dan lampin berdasarkan data tender.

## Cara guna

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Data tender disimpan di `public/data`:

- `parliament-zones.json`
- `tender-susu.json`
- `tender-lampin.json`
- `delivery-fees.json`

Kemas kini fail JSON ini untuk ubah harga, pembekal, zon, produk, PCS per pack atau kos penghantaran tanpa mengubah kod UI.
