# video — ürün tanıtım videosu üretim sistemi

Herhangi bir web projesine (Next.js, Nuxt, Astro, Vue, React, Svelte, Angular, Laravel, Django… fark etmez)
profesyonel, animasyonlu bir tanıtım videosu hazırlatmak için. Video, sitenin **gerçek arayüzünden** çekilir:
kamera sayfaların üzerinde süzülür, macOS imleci gerçek butonlara tıklar, kartlar öne çıkar, sayılar akar;
seslendirme kelime kelime altyazıyla gelir, sahneler müziğin vuruşlarına oturur.

## Kullanım

```bash
cd projem
git clone https://github.com/thesleax/video video
```
Sonra Claude Code'a:

> video/PLAYBOOK.md dosyasını oku ve bu proje için tanıtım videosu hazırla.

Claude projeyi inceler (framework, sayfalar, renkler, font, logo), senaryoyu yazar, seslendirmeyi üretir,
müziği analiz eder, siteyi çeker, sahneleri kurar, kontrolleri yapar ve videoyu render eder. Senden sadece
müzik dosyasını indirmeni isteyecek (Pixabay sunuculardan indirmeye izin vermiyor) ve senaryoyu onaylamanı.

## İçinde ne var

| | |
|---|---|
| **Görüntü** | Remotion (React ile video), 1920×1080, 60 fps, otomatik motion blur, alan derinliği |
| **Çekim** | Playwright ile sitenin karanlık temada tam sayfa ekran görüntüleri + her butonun/kartın gerçek konumu ve linki |
| **Seslendirme** | Kokoro TTS, `af_heart` sesi (yerel, ücretsiz, ticari kullanım serbest) + whisper.cpp ile kelime zamanları |
| **Müzik** | Alex_MakeMusic (Pixabay) — önerilen parçalar `docs/MUSIC.md`'de; vuruş/drop analizi ve kesim aracı |
| **Ses efektleri** | Referans videodaki 21 Mixkit efekti (kurulumda indirilir) — `docs/SOUND.md` |
| **Kontrol** | hareket hızı denetimi (optik akış), seslendirme/müzik oranı ölçümü, -14 LUFS mastering |

## Klasörler

- `PLAYBOOK.md` — Claude'un adım adım izlediği süreç
- `docs/` — STYLE (kurallar), SCENES (sahne kataloğu), VOICE, MUSIC, SOUND, QA
- `setup.sh` — sıfır bir Ubuntu/Debian sunucuya her şeyi kurar
- `src/kit`, `src/recipes` — ortak bileşenler ve hazır sahneler
- `src/project` — projeye özel kısım (marka, senaryo, zaman çizelgesi, sahneler)
- `scripts/` — tespit, çekim, seslendirme, müzik, denetim ve mastering araçları

## Gereksinimler ve süre

Ubuntu/Debian, 4+ çekirdek, 8 GB RAM, ~3 GB disk. GPU gerekmez. 1,5 dakikalık bir videonun tam render'ı
GPU'suz bir VDS'te yaklaşık 45–60 dakika sürer; ses düzeltmeleri dakikalar içinde yapılır.

## Lisanslar

Remotion: bireyler ve en fazla 3 çalışanlı şirketler için ücretsiz (daha büyükse Remotion şirket lisansı gerekir).
Kokoro: Apache-2.0. Müzik: Pixabay Content License. Ses efektleri: Mixkit lisansı (dosyalar repoda tutulmaz,
kurulumda indirilir).
