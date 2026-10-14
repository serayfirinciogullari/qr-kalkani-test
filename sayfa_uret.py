"""QR test sayfalarını üretir (Görev 2, g2-8).

icerikler.json (işletme içeriği) + tasarimlar.json (görünüm) -> her temiz QR için ayrı bir klasör:
    <yol>/index.html              temiz QR'ın açtığı işletme sayfası
    s/<sahte_yol>/index.html      o işletmenin QR'ının üstüne yapıştırılan sahte etiketin açtığı uyarı
    index.html, 404.html          proje tanıtımı
Bu klasör olduğu gibi herkese açık 'qr-kalkani-test' reposuna (GitHub Pages) gönderilir.

Çalıştırma (proje kökünden):
    C:\\Users\\seray\\venvs\\qr-kalkani\\Scripts\\python.exe kod/qr-test-sayfasi/sayfa_uret.py
"""
import html
import json
import shutil
from pathlib import Path
from urllib.parse import quote_plus

KLASOR = Path(__file__).resolve().parent
ISARET = "<!-- sayfa_uret.py ile üretildi, elle düzenleme -->"
EL_YAZISI = {"Pacifico", "Caveat", "Patrick Hand"}
SERIF = {"Lora", "Merriweather", "Playfair Display", "DM Serif Display", "Source Serif 4", "Libre Baskerville"}


def yukle(ad: str) -> dict:
    """JSON'u okur; '_' ile başlayan anahtarlar (açıklama, dış kaynaklı QR'ların sahteleri) ayrıca okunur."""
    with (KLASOR / ad).open(encoding="utf-8") as f:
        return {k: v for k, v in json.load(f).items() if not k.startswith("_")}


def dis_sahteler() -> dict:
    with (KLASOR / "icerikler.json").open(encoding="utf-8") as f:
        return json.load(f)["_dis_sahte"]


def font_ailesi(tanim: str) -> str:
    ad = tanim.split(":")[0]
    yedek = "cursive" if ad in EL_YAZISI else "serif" if ad in SERIF else "sans-serif"
    return f"'{ad}', {yedek}"


def font_baglantisi(*tanimlar: str) -> str:
    aileler = "&".join("family=" + quote_plus(t, safe=":;@,") for t in dict.fromkeys(tanimlar))
    return (
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{aileler}&display=swap">\n'
    )


def json_gom(veri: dict) -> str:
    # </script> kapanışını bozmasın diye "</" kaçırılır
    return json.dumps(veri, ensure_ascii=False).replace("</", "<\\/")


def sayfa(baslik: str, kok: str, govde_ozellik: str, ek_bas: str, veri: dict, tema_rengi: str) -> str:
    return f"""<!doctype html>
{ISARET}
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="{tema_rengi}">
<title>{html.escape(baslik)}</title>
{ek_bas}<link rel="stylesheet" href="{kok}assets/stil.css">
</head>
<body {govde_ozellik}>
<main id="uygulama"></main>
<script>window.SAYFA = {json_gom(veri)};</script>
<script src="{kok}assets/uygulama.js"></script>
</body>
</html>
"""


def temiz_sayfa(kimlik: str, ic: dict, t: dict) -> str:
    stil = (f'style="--vurgu:{t["vurgu"]};--zemin:{t["zemin"]};--r:{t["r"]}px;'
            f'--f-baslik:{font_ailesi(t["baslik"])};--f-govde:{font_ailesi(t["govde"])}"').replace("'", "&#39;")
    sinif = ' class="koyu"' if t.get("koyu") else ""
    ozellik = f'data-ust="{t["ust"]}" data-kart="{t["kart"]}" data-desen="{t["desen"]}"{sinif} {stil}'
    veri = dict(ic, kimlik=kimlik, tasarim={"logo": t["logo"]})
    return sayfa(f'{ic["isletme"]} · {ic["alt"]}', "../", ozellik, font_baglantisi(t["baslik"], t["govde"]), veri, t["zemin"])


def sahte_sayfa(kimlik: str, isletme: str, temiz_yol: str) -> str:
    veri = {"sahte": True, "kimlik": kimlik, "isletme": isletme, "temiz_yol": temiz_yol}
    return sayfa("DİKKAT: Sahte QR", "../../", "", "", veri, "#c0221b")


TANITIM = f"""<!doctype html>
{ISARET}
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>QR Kalkanı · Test sayfaları</title>
<link rel="stylesheet" href="/qr-kalkani-test/assets/stil.css">
</head>
<body>
<main><section class="tanitim">
<svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true"><path fill="#164aa0" d="M12 1 3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4Z"/></svg>
<h1>QR Kalkanı</h1>
<p>QR kodların üstüne yapıştırılan sahte etiketleri görüntü işleme ve derin öğrenmeyle tespit eden bitirme projesinin test sayfaları. Buradaki işletmelerin hepsi kurgusaldır; hiçbir sayfa bilgi istemez ve toplamaz.</p>
</section></main>
</body>
</html>
"""


def eskileri_sil():
    """Önceki çalıştırmadan kalan üretilmiş klasörleri siler (sadece ISARET taşıyan sayfaların klasörleri)."""
    for yol in list(KLASOR.rglob("index.html")):
        if yol.parent == KLASOR or "assets" in yol.parts:
            continue
        if ISARET in yol.read_text(encoding="utf-8"):
            shutil.rmtree(yol.parent)
    s = KLASOR / "s"
    if s.exists() and not any(s.iterdir()):
        s.rmdir()


def main():
    icerikler, tasarimlar = yukle("icerikler.json"), yukle("tasarimlar.json")
    eksik = set(icerikler) ^ set(tasarimlar)
    if eksik:
        raise SystemExit(f"İçerik ve tasarım listeleri uyuşmuyor: {sorted(eksik)}")
    eskileri_sil()
    sayfalar = []
    for kimlik, ic in sorted(icerikler.items()):
        sayfalar.append((KLASOR / ic["yol"], temiz_sayfa(kimlik, ic, tasarimlar[kimlik])))
        sayfalar.append((KLASOR / "s" / ic["sahte_yol"], sahte_sayfa(kimlik, ic["isletme"], f'../../{ic["yol"]}/')))
    dis = dis_sahteler()
    for kimlik, d in sorted(dis.items()):
        sayfalar.append((KLASOR / "s" / d["sahte_yol"], sahte_sayfa(kimlik, d["isletme"], d["temiz_url"])))
    for yol, metin in sayfalar:
        yol.mkdir(parents=True, exist_ok=True)
        (yol / "index.html").write_text(metin, encoding="utf-8")
    (KLASOR / "index.html").write_text(TANITIM, encoding="utf-8")
    (KLASOR / "404.html").write_text(TANITIM, encoding="utf-8")
    print(f"{len(icerikler)} temiz + {len(icerikler) + len(dis)} sahte sayfa üretildi.")


if __name__ == "__main__":
    main()
