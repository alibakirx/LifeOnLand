# Life on Land - Interactive Ecosystem Simulation

Bu proje, karadaki yaşamı simüle eden interaktif bir ekosistem uygulamasıdır. Çayırlar, ovalar ve platolar üzerinde 3 farklı kara hayvanının (geyik, tavşan ve kuş) sürü halinde dolaştığı bir doğa simülasyonu sunar.

## Özellikler

- **Dinamik Arazi**: Çayırlar, ovalar ve platolar olarak farklı arazi türleri
- **3 Farklı Hayvan Türü**:
  - 🦌 **Geyikler**: Büyük, sakin hareket eden, kahverengi renkte
  - 🐰 **Tavşanlar**: Küçük, hızlı hareket eden, beyaz kuyruklu
  - 🐦 **Kuşlar**: Uçan, mavi renkte, çabuk hareket eden
- **Sürü Davranışı**: Hayvanlar kendi türleriyle grup oluşturur
- **Gerçek Zamanlı Simülasyon**: Sürekli değişen ekosistem
- **Responsive Tasarım**: Tüm ekran boyutlarında çalışır

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## Teknolojiler

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **p5.js**: Grafik ve animasyon
- **React 18**: UI framework

## Proje Yapısı

```
├── components/
│   └── LifeOnLand.tsx    # Ana simülasyon komponenti
├── pages/
│   ├── _app.tsx          # App wrapper
│   └── index.tsx         # Ana sayfa
├── styles/
│   └── globals.css       # Global stiller
└── package.json          # Proje bağımlılıkları
```

## Hayvan Davranışları

### Geyikler
- Sakin ve büyük gruplar oluşturur
- Orta hızda hareket eder
- Boynuzları vardır

### Tavşanlar
- Hızlı ve çevik
- Küçük gruplar halinde
- Beyaz kuyrukları ile tanınır

### Kuşlar
- En hızlı hareket eden tür
- Gökyüzünde uçar
- Mavi renkte kanatları

## Komutlar

- `npm run dev` - Geliştirme sunucusunu başlatır
- `npm run build` - Production build oluşturur
- `npm run start` - Production sunucusunu başlatır
- `npm run lint` - Kodu kontrol eder 