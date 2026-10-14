/* QR Kalkanı test sayfaları: sayfa verisi (window.SAYFA) işletmenin türüne göre çizilir.
   Güvenlik: hiçbir bilgi bir yere gönderilmez, form gönderimi yoktur; plaka gibi girdiler
   sadece bu telefonda hesaplamaya kullanılır. Doluluk gibi canlı görünen sayılar kurgusaldır
   (saate göre üretilir). */
(function () {
  "use strict";
  var S = window.SAYFA || {};
  var main = document.getElementById("uygulama");

  // ---------------------------------------------------------------- yardımcılar
  function el(etiket, sinif, metin) {
    var e = document.createElement(etiket);
    if (sinif) e.className = sinif;
    if (metin != null) e.textContent = metin;
    return e;
  }
  function ekle(ebeveyn) {
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) ebeveyn.appendChild(arguments[i]);
    return ebeveyn;
  }
  function kart(baslik) {
    var k = el("section", "kart");
    if (baslik) k.appendChild(el("h2", null, baslik));
    return k;
  }
  function satir(ad, deger, aciklama, sinif) {
    var s = el("div", "satir" + (sinif ? " " + sinif : ""));
    var sol = el("div", null, ad);
    if (aciklama) sol.appendChild(el("small", null, aciklama));
    return ekle(s, sol, el("span", "deger", deger));
  }
  function ozet(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // Aynı 5 dakika içinde aynı sayıyı veren kurgusal "canlı" değer üretici
  function zar(tohum) {
    var x = ozet(S.isletme + "|" + tohum + "|" + Math.floor(Date.now() / 300000)) || 1;
    return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return (x % 100000) / 100000; };
  }
  function dakika(saat) { var p = saat.split(":"); return Number(p[0]) * 60 + Number(p[1]); }
  function suankiDakika() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function iki(n) { return (n < 10 ? "0" : "") + n; }
  function saatMetni(dk) { dk = ((dk % 1440) + 1440) % 1440; return iki(Math.floor(dk / 60)) + ":" + iki(dk % 60); }
  function tl(n) { return n.toLocaleString("tr-TR") + " TL"; }
  function fiyatSayi(m) { var r = /^([\d.]+) TL$/.exec(m); return r ? Number(r[1].replace(/\./g, "")) : null; }
  // Saat gün içinde dolulukla ilgili kurgusal bir eğri: öğlen ve akşam yoğun
  function yogunluk() {
    var h = suankiDakika() / 60;
    return 0.25 + 0.45 * Math.exp(-Math.pow((h - 13) / 3, 2)) + 0.3 * Math.exp(-Math.pow((h - 19) / 2.5, 2));
  }

  var GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  function acikMi() {
    if (!S.saat) return null;
    var d = new Date(), bugun = S.saat[d.getDay()], dun = S.saat[(d.getDay() + 6) % 7], n = suankiDakika();
    // Gece yarısını geçen dünkü vardiya hâlâ sürüyor mu?
    if (dun) { var da = dakika(dun[0]), dk = dakika(dun[1]); if (dk <= da && n < dk) return { acik: true, metin: "Şu an açık · Kapanış " + dun[1] }; }
    if (!bugun) return { acik: false, metin: "Bugün kapalı" };
    var a = dakika(bugun[0]), k = dakika(bugun[1]);
    if (k <= a) k += 1440;
    if (n >= a && n < k) return { acik: true, metin: "Şu an açık · Kapanış " + bugun[1] };
    return { acik: false, metin: n < a ? "Şu an kapalı · Açılış " + bugun[0] : "Şu an kapalı" };
  }

  // ---------------------------------------------------------------- başlık
  function baslik() {
    var t = S.tasarim || {};
    var ust = el("header", "ust");
    if (t.logo && t.logo !== "yok") {
      var logo = el("div", "logo " + t.logo);
      if (t.logo === "monogram") {
        logo.textContent = S.isletme.replace(/^Örnek\s+/, "").split(/\s+/).map(function (k) { return k.charAt(0); }).join("").slice(0, 2);
      } else logo.textContent = S.ikon;
      ust.appendChild(logo);
    }
    var yazi = el("div");
    ekle(yazi, el("h1", null, S.isletme), el("p", "alt", S.alt));
    if (S.slogan) yazi.appendChild(el("p", "slogan", S.slogan));
    var a = acikMi();
    if (a) { var d = el("span", "durum" + (a.acik ? "" : " kapali")); ekle(d, el("i"), document.createTextNode(a.metin)); yazi.appendChild(d); }
    ust.appendChild(yazi);
    ust.appendChild(el("span", "arka-ikon", S.ikon));
    return ust;
  }

  function bolumler(atla) {
    var parca = document.createDocumentFragment();
    (S.bolumler || []).forEach(function (b) {
      if (atla && atla.indexOf(b[0]) >= 0) return;
      var k = kart(b[0]);
      b[1].forEach(function (o) { k.appendChild(satir(o[0], o[1], o[2])); });
      parca.appendChild(k);
    });
    return parca;
  }

  function saatler() {
    if (!S.saat) return null;
    var k = kart("Çalışma saatleri"), bugun = new Date().getDay();
    [1, 2, 3, 4, 5, 6, 0].forEach(function (g) {
      var s = S.saat[g];
      k.appendChild(satir(GUNLER[g], s ? s[0] + " - " + s[1] : "Kapalı", null, g === bugun ? "vurgulu" : ""));
    });
    return k;
  }

  // ---------------------------------------------------------------- türler
  var TURLER = {};

  TURLER.kafe = function () {
    var sepet = {}, fiyatlar = {};
    var parca = document.createDocumentFragment();
    (S.bolumler || []).forEach(function (b) {
      var k = kart(b[0]);
      b[1].forEach(function (o) {
        var f = fiyatSayi(o[1]);
        var u = el("div", "urun"), sol = el("div", null, o[0]);
        if (o[2]) sol.appendChild(el("small", null, o[2]));
        var dugme = el("button", "ekle", "+");
        dugme.type = "button";
        dugme.setAttribute("aria-label", o[0] + " ekle");
        if (f == null) dugme.style.visibility = "hidden";
        fiyatlar[o[0]] = f;
        dugme.addEventListener("click", function () {
          sepet[o[0]] = (sepet[o[0]] || 0) + 1;
          dugme.innerHTML = "";
          dugme.appendChild(el("span", "adet", String(sepet[o[0]])));
          guncelle();
        });
        ekle(k, ekle(u, sol, el("span", "fiyat", o[1]), dugme));
      });
      parca.appendChild(k);
    });

    var cubuk = el("div", "sepet"); cubuk.hidden = true;
    var bilgi = el("span"), goster = el("button", null, "Siparişi göster");
    goster.type = "button";
    ekle(cubuk, bilgi, goster);
    document.body.appendChild(cubuk);

    function toplam() { var t = 0, a = 0; for (var u in sepet) { t += sepet[u] * fiyatlar[u]; a += sepet[u]; } return { tutar: t, adet: a }; }
    function guncelle() { var t = toplam(); cubuk.hidden = t.adet === 0; bilgi.textContent = t.adet + " ürün · " + tl(t.tutar); }

    goster.addEventListener("click", function () {
      var perde = el("div", "perde"), s = el("div", "sayfa");
      perde.setAttribute("role", "dialog");
      ekle(s, el("h2", null, S.alt && /Masa/.test(S.alt) ? S.alt : "Siparişiniz"),
        el("p", "buyuk", "Bu ekranı garsona gösterin. Sipariş buradan bir yere gönderilmez."));
      for (var u in sepet) s.appendChild(satir(sepet[u] + " × " + u, tl(sepet[u] * fiyatlar[u])));
      var t = el("div", "toplam"); ekle(t, el("span", null, "Toplam"), el("span", null, tl(toplam().tutar)));
      var kapat = el("button", "dugme", "Tamam"), temizle = el("button", "dugme ikincil", "Sepeti temizle");
      kapat.type = temizle.type = "button";
      kapat.onclick = function () { perde.remove(); };
      perde.onclick = function (e) { if (e.target === perde) perde.remove(); };
      temizle.onclick = function () {
        sepet = {};
        document.querySelectorAll(".ekle").forEach(function (d) { d.textContent = "+"; });
        guncelle(); perde.remove();
      };
      ekle(s, t, el("p", "not", S.not), kapat, temizle);
      document.body.appendChild(ekle(perde, s));
    });
    return parca;
  };

  TURLER.otopark = function () {
    var parca = document.createDocumentFragment();
    var z = zar("doluluk"), katlar = S.katlar || ["Zemin"];
    var kapasite = S.kapasite, katKap = Math.round(kapasite / katlar.length), dolu = 0, katDolu = [];
    katlar.forEach(function (_, i) {
      var oran = Math.min(0.99, yogunluk() * (0.75 + z() * 0.45) * (i === 0 ? 1.15 : 0.9));
      katDolu.push(Math.round(katKap * oran)); dolu += katDolu[i];
    });
    var bos = kapasite - dolu;
    var d = kart("Anlık doluluk");
    var sayi = el("div", "doluluk-sayi");
    ekle(sayi, el("b", null, String(bos)), el("span", null, "boş yer · toplam " + kapasite));
    var cub = el("div", "cubuk"), ic = el("i"); ic.style.width = Math.round(100 * dolu / kapasite) + "%"; cub.appendChild(ic);
    var kg = el("div", "katlar");
    katlar.forEach(function (k, i) {
      var b = katKap - katDolu[i], kk = el("div", "kat" + (b < katKap * 0.08 ? " dolu" : ""));
      ekle(kk, el("b", null, String(b)), document.createTextNode("Kat " + k));
      kg.appendChild(kk);
    });
    ekle(d, sayi, cub, el("small", "gizlilik", "Son güncelleme " + saatMetni(suankiDakika())), kg);
    parca.appendChild(d);

    // Plaka ile ücret sorgulama (sadece bu telefonda hesaplanır)
    var sorgu = kart("Ücret sorgula");
    sorgu.appendChild(el("p", "not", "Plakanızı yazın; giriş saatiniz ve ödeyeceğiniz tutar hesaplansın."));
    var form = el("form", "form"), girdi = el("input"), dugme = el("button", null, "Sorgula");
    girdi.placeholder = "34 ABC 123"; girdi.autocomplete = "off"; girdi.maxLength = 12; girdi.setAttribute("aria-label", "Plaka");
    dugme.type = "submit";
    ekle(form, girdi, dugme);
    var hata = el("p", "hata"), fis = el("div", "fis");
    hata.hidden = fis.hidden = true;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var p = girdi.value.toUpperCase().replace(/\s+/g, "");
      var m = /^(0[1-9]|[1-7][0-9]|8[01])([A-Z]{1,3})(\d{2,4})$/.exec(p);
      if (!m) { hata.textContent = "Geçerli bir plaka yazın (ör. 34 ABC 123)."; hata.hidden = false; fis.hidden = true; return; }
      hata.hidden = true;
      var h = ozet(p + S.isletme + new Date().toDateString());
      var sure = 20 + (h % 560);                       // dakika
      var giris = suankiDakika() - sure;
      var saat = Math.ceil(sure / 60), c = S.hesap;
      var ucretli = Math.max(0, saat - c.ucretsiz_saat);
      var ucret = ucretli === 0 ? 0 : Math.min(c.gunluk, c.ilk_saat + (ucretli - 1) * c.ek_saat);
      var kod = String(1000 + (h >>> 7) % 9000);
      fis.innerHTML = "";
      ekle(fis,
        satir("Plaka", m[1] + " " + m[2] + " " + m[3]),
        satir("Giriş", saatMetni(giris) + (giris < 0 ? " (dün)" : "")),
        satir("Süre", Math.floor(sure / 60) + " sa " + (sure % 60) + " dk"),
        el("div", "ucret", ucret === 0 ? "Ücretsiz" : tl(ucret)),
        el("p", "not", "Çıkış kodunuz:"),
        el("div", "kod", kod),
        el("p", "not", S.not + " Kodu gişeye ya da ödeme makinesine gösterin."));
      fis.hidden = false;
    });
    ekle(sorgu, form, hata, fis, el("p", "gizlilik", "Plakanız bu telefondan çıkmaz, hiçbir yere gönderilmez. Bu sayfada ödeme alınmaz."));
    parca.appendChild(sorgu);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.sarj = function () {
    var parca = document.createDocumentFragment(), z = zar("soket");
    var k = kart("Soketler");
    S.soketler.forEach(function (s, i) {
      var r = z(), durum = r < 0.12 ? ["Arızalı", "ariza"] : r < 0.55 ? ["Şarjda", "mesgul"] : ["Müsait", "musait"];
      if (S.alt.indexOf(s[0]) >= 0 && durum[1] === "ariza") durum = ["Müsait", "musait"];
      var o = el("div", "liste-ogesi" + (S.alt.indexOf(s[0]) >= 0 ? " satir vurgulu" : ""));
      var sol = el("div", null, s[0]); sol.appendChild(el("small", null, s[1]));
      ekle(k, ekle(o, sol, el("span", "nokta " + durum[1], durum[0])));
    });
    parca.appendChild(k);

    var h = kart("Ücret hesapla"), tip = "dc", kwh = 30;
    var secim = el("div", "secim"), ac = el("button", null, "AC 22 kW"), dc = el("button", null, "DC 120 kW");
    ac.type = dc.type = "button";
    var etiket = el("label", null, ""), aralik = el("input"), sonuc = el("div", "sonuc");
    aralik.type = "range"; aralik.min = 5; aralik.max = 80; aralik.value = kwh; aralik.setAttribute("aria-label", "kWh");
    function ciz() {
      ac.setAttribute("aria-pressed", tip === "ac"); dc.setAttribute("aria-pressed", tip === "dc");
      var fiyat = tip === "ac" ? S.fiyat_ac : S.fiyat_dc, guc = tip === "ac" ? 22 : 120;
      etiket.textContent = kwh + " kWh";
      sonuc.innerHTML = "";
      ekle(sonuc, el("span", null, "Yaklaşık " + Math.max(1, Math.round(kwh / guc * 60 * 1.1)) + " dk"), el("b", null, tl(kwh * fiyat)));
    }
    ac.onclick = function () { tip = "ac"; ciz(); };
    dc.onclick = function () { tip = "dc"; ciz(); };
    aralik.oninput = function () { kwh = Number(aralik.value); ciz(); };
    ekle(h, ekle(secim, ac, dc), etiket, aralik, sonuc);
    ciz();
    parca.appendChild(h);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.bisiklet = function () {
    var parca = document.createDocumentFragment(), z = zar("bisiklet");
    var musait = Math.max(1, Math.round(S.kapasite * (1 - yogunluk()) * (0.7 + z() * 0.5)));
    var k = kart("İstasyon durumu");
    var sayi = el("div", "doluluk-sayi"); ekle(sayi, el("b", null, String(Math.min(musait, S.kapasite))), el("span", null, "kiralanabilir bisiklet · " + S.kapasite + " park yeri"));
    ekle(k, sayi);
    parca.appendChild(k);
    var h = kart("Ücret hesapla"), dk = 45;
    var etiket = el("label"), aralik = el("input"), sonuc = el("div", "sonuc");
    aralik.type = "range"; aralik.min = 15; aralik.max = 240; aralik.step = 15; aralik.value = dk; aralik.setAttribute("aria-label", "Süre");
    function ciz() {
      var ucret = dk <= 30 ? 20 : 20 + Math.ceil((dk - 30) / 15) * 10;
      ucret = Math.min(200, ucret);
      etiket.textContent = Math.floor(dk / 60) ? Math.floor(dk / 60) + " sa " + (dk % 60) + " dk" : dk + " dk";
      sonuc.innerHTML = ""; ekle(sonuc, el("span", null, "Kiralama süresi"), el("b", null, tl(ucret)));
    }
    aralik.oninput = function () { dk = Number(aralik.value); ciz(); };
    ekle(h, etiket, aralik, sonuc); ciz();
    parca.appendChild(h);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.otobus = function () {
    var parca = document.createDocumentFragment();
    var k = kart("Sıradaki otobüsler");
    var liste = el("div");
    function ciz() {
      liste.innerHTML = "";
      var n = suankiDakika();
      S.hatlar.forEach(function (h) {
        var no = h[0], yon = h[1], siklik = h[2], ilk = 6 * 60 + h[3];
        var sonraki = n < ilk ? ilk : ilk + Math.ceil((n - ilk) / siklik) * siklik;
        var o = el("div", "hat"), sag = el("div", "dk");
        if (sonraki > 23 * 60 + 30) { sag.textContent = "—"; sag.appendChild(el("small", null, "Sefer yok")); }
        else {
          var kalan = sonraki - n;
          sag.textContent = kalan <= 0 ? "Şimdi" : kalan + " dk";
          sag.appendChild(el("small", null, saatMetni(sonraki) + " · sonra " + saatMetni(sonraki + siklik)));
        }
        var orta = el("div", null, yon); orta.appendChild(el("small", "gizlilik", "Her " + siklik + " dakikada bir"));
        ekle(liste, ekle(o, el("div", "no", no), orta, sag));
      });
    }
    ciz(); setInterval(ciz, 20000);
    ekle(k, liste);
    parca.appendChild(k);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.sinema = function () {
    var parca = document.createDocumentFragment(), z = zar("koltuk"), n = suankiDakika();
    var k = kart("Bugünkü seanslar");
    var sirada = null;
    S.seanslar.forEach(function (f) { f[2].forEach(function (s) { var d = dakika(s); if (d > n && (sirada === null || d < sirada)) sirada = d; }); });
    S.seanslar.forEach(function (f) {
      var o = el("div", "film");
      ekle(o, el("h3", null, f[0]), el("small", "gizlilik", f[1] + " · kalan koltuk " + (8 + Math.round(z() * 90))));
      var sk = el("div", "seans");
      f[2].forEach(function (s) {
        var d = dakika(s);
        sk.appendChild(el("span", d <= n ? "gecti" : d === sirada ? "sirada" : "", s));
      });
      ekle(k, ekle(o, sk));
    });
    parca.appendChild(k);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.etkinlik = function () {
    var parca = document.createDocumentFragment();
    var k = kart("Konsere kalan süre"), sayac = el("div", "sayac");
    function hedef() {
      var d = new Date(), h = new Date(d), s = S.etkinlik_saati.split(":");
      h.setHours(Number(s[0]), Number(s[1]), 0, 0);
      var fark = (S.etkinlik_gunu - d.getDay() + 7) % 7;
      h.setDate(h.getDate() + fark);
      if (h < d) h.setDate(h.getDate() + 7);
      return h;
    }
    function ciz() {
      var ms = hedef() - new Date(), t = Math.floor(ms / 1000);
      var parcalar = [[Math.floor(t / 86400), "gün"], [Math.floor(t / 3600) % 24, "saat"], [Math.floor(t / 60) % 60, "dakika"], [t % 60, "saniye"]];
      sayac.innerHTML = "";
      parcalar.forEach(function (p) { var d = el("div"); ekle(d, el("b", null, String(p[0])), el("span", null, p[1])); sayac.appendChild(d); });
    }
    ciz(); setInterval(ciz, 1000);
    ekle(k, el("p", "not", GUNLER[S.etkinlik_gunu] + " " + S.etkinlik_saati), sayac);
    parca.appendChild(k);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.spor = function () {
    var parca = document.createDocumentFragment(), z = zar("spor");
    var k = kart("Şu an salonda");
    var kisi = Math.round(S.kapasite * yogunluk() * (0.6 + z() * 0.5));
    var sayi = el("div", "doluluk-sayi"); ekle(sayi, el("b", null, String(kisi)), el("span", null, "kişi · kapasite " + S.kapasite));
    var cub = el("div", "cubuk"), ic = el("i"); ic.style.width = Math.min(100, Math.round(100 * kisi / S.kapasite)) + "%"; cub.appendChild(ic);
    ekle(k, sayi, cub);
    parca.appendChild(k);
    var p = kart("Haftalık ders programı"), bugun = new Date().getDay();
    [1, 2, 3, 4, 5, 6, 0].forEach(function (g) {
      S.dersler.forEach(function (d) { if (d[0] === g) p.appendChild(satir(GUNLER[g] + " " + d[1], d[2], null, g === bugun ? "vurgulu" : "")); });
    });
    parca.appendChild(p);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.kuafor = function () {
    var parca = document.createDocumentFragment(), z = zar("slot");
    var bugun = S.saat[new Date().getDay()];
    var k = kart("Bugün boş saatler");
    if (!bugun) k.appendChild(el("p", "not", "Bugün kapalıyız."));
    else {
      var g = el("div", "slotlar"), n = suankiDakika();
      for (var d = dakika(bugun[0]); d < dakika(bugun[1]); d += 30) {
        var dolu = d <= n || z() < 0.55;
        g.appendChild(el("span", dolu ? "dolu" : "", saatMetni(d)));
      }
      ekle(k, g, el("p", "gizlilik", "Randevu için salonu arayın; bu sayfadan randevu alınmaz."));
    }
    parca.appendChild(k);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.kutuphane = function () {
    var parca = document.createDocumentFragment(), z = zar("salon");
    var k = kart("Çalışma salonu");
    var a = acikMi(), dolu = a && a.acik ? Math.round(S.kapasite * Math.min(0.97, yogunluk() * (0.8 + z() * 0.4))) : 0;
    var sayi = el("div", "doluluk-sayi"); ekle(sayi, el("b", null, String(S.kapasite - dolu)), el("span", null, "boş masa · toplam " + S.kapasite));
    var cub = el("div", "cubuk"), ic = el("i"); ic.style.width = Math.round(100 * dolu / S.kapasite) + "%"; cub.appendChild(ic);
    ekle(k, sayi, cub);
    parca.appendChild(k);
    parca.appendChild(bolumler(["Doluluk"]));
    return parca;
  };

  TURLER.muze = function () {
    var parca = document.createDocumentFragment(), z = zar("muze"), a = acikMi();
    var k = kart("Şu an müzede");
    var kisi = a && a.acik ? Math.round(40 + 260 * yogunluk() * (0.7 + z() * 0.5)) : 0;
    var sayi = el("div", "doluluk-sayi"); ekle(sayi, el("b", null, String(kisi)), el("span", null, kisi ? "ziyaretçi · ortalama gezi 75 dk" : "müze şu an kapalı"));
    ekle(k, sayi);
    parca.appendChild(k);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.kargo = function () {
    var parca = document.createDocumentFragment();
    var k = kart("Gönderi sorgula");
    k.appendChild(el("p", "not", "Kargo fişinizdeki 10 haneli takip numarasını yazın."));
    var form = el("form", "form"), girdi = el("input"), dugme = el("button", null, "Sorgula");
    girdi.inputMode = "numeric"; girdi.maxLength = 10; girdi.placeholder = "1234567890"; girdi.setAttribute("aria-label", "Takip numarası");
    dugme.type = "submit";
    var hata = el("p", "hata"), sonuc = el("div", "fis"); hata.hidden = sonuc.hidden = true;
    var DURUMLAR = ["Kabul edildi · Çarşı şubesi", "Transfer merkezinde", "Dağıtıma çıktı", "Şubede, teslim alınmayı bekliyor"];
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = girdi.value.replace(/\D/g, "");
      if (v.length !== 10) { hata.textContent = "Takip numarası 10 haneli olmalı."; hata.hidden = false; sonuc.hidden = true; return; }
      hata.hidden = true;
      var h = ozet(v), adim = h % DURUMLAR.length;
      sonuc.innerHTML = "";
      for (var i = 0; i <= adim; i++) sonuc.appendChild(satir(DURUMLAR[i], i === adim ? "Son durum" : "✓", null, i === adim ? "vurgulu" : ""));
      sonuc.hidden = false;
    });
    ekle(k, ekle(form, girdi, dugme), hata, sonuc, el("p", "gizlilik", "Numara bu telefondan çıkmaz. Kargo şirketleri SMS ya da QR ile ödeme veya adres onayı istemez."));
    parca.appendChild(k);
    parca.appendChild(bolumler());
    return parca;
  };

  TURLER.kampus = function () {
    var parca = document.createDocumentFragment();
    var k = kart("Duyurular");
    S.duyurular.forEach(function (d) { var o = el("div", "duyuru"); ekle(k, ekle(o, el("b", null, d[0]), el("span", null, d[1]))); });
    parca.appendChild(k);
    parca.appendChild(bolumler());
    return parca;
  };

  // ---------------------------------------------------------------- sahte uyarı
  function sahteSayfa() {
    document.body.classList.add("sahte-govde");
    document.title = "DİKKAT: Sahte QR";
    var k = (new URLSearchParams(location.search).get("k") || "").toLowerCase();
    var kimlik = /^\d{2}[ab]$/.test(k) ? "S" + k + " → asıl QR " + S.kimlik : "asıl QR " + S.kimlik;
    var s = el("section", "sahte");
    s.innerHTML = '<svg class="uyari-ikon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M12 2 1 21h22L12 2Zm0 4.3L19.5 19h-15L12 6.3ZM11 10v5h2v-5h-2Zm0 6v2h2v-2h-2Z"/></svg>';
    ekle(s, el("h1", null, "DUR! Bu QR sahte"));
    var giris = el("p", "giris"); giris.appendChild(document.createTextNode("Bu etiket, şu işletmenin gerçek QR'ının üstüne yapıştırılmış: "));
    giris.appendChild(el("b", null, S.isletme));
    s.appendChild(giris);

    var k1 = el("div", "kutu");
    ekle(k1, el("h2", null, "Gerçek hayatta ne olurdu?"),
      el("p", null, "Dolandırıcılar menü, otopark ve şarj istasyonlarındaki QR'ların üstüne kendi etiketlerini yapıştırır. Bu bağlantı seni gerçeğine benzeyen bir ödeme ya da giriş sayfasına götürür ve kart veya hesap bilgilerini ister. Bu saldırıya quishing (QR ile oltalama) denir."));
    var k2 = el("div", "kutu");
    var gercekAdres = new URL(S.temiz_yol, location.href).href;
    ekle(k2, el("h2", null, "Adrese dikkat"),
      el("p", null, "Bu sahte etiketin açtığı adres:"), el("div", "adres", location.origin + location.pathname),
      el("p", null, "Asıl QR'ın açtığı adres:"), el("div", "adres iyi", gercekAdres));
    var gercek = el("a", "gercek", "Asıl QR seni buraya götürürdü: " + S.isletme + " →");
    gercek.href = S.temiz_yol;
    k2.appendChild(gercek);

    var k3 = el("div", "kutu");
    k3.innerHTML = "<h2>Sahte etiket nasıl anlaşılır?</h2><ul>" +
      "<li><span>1</span><span><b>Kalkık kenar:</b> etiketin köşesi yüzeyden ayrılmış olabilir.</span></li>" +
      "<li><span>2</span><span><b>Alttan görünen kağıt:</b> asıl QR'ın kenarı etiketin altından taşar.</span></li>" +
      "<li><span>3</span><span><b>Gölge ve çift kenar:</b> üst üste iki katman ince bir gölge bırakır.</span></li>" +
      "<li><span>4</span><span><b>Boyut ve renk farkı:</b> etiket çevresindeki tabeladan farklı durur.</span></li></ul>";
    var g = el("div", "guvende", "Endişelenme: bu bir test etiketidir. Hiçbir bilgi istenmez ve toplanmaz. QR Kalkanı uygulaması bu etiketleri kameradan, bağlantıyı açmadan yakalamak için geliştiriliyor.");
    ekle(s, k1, k2, k3, g, el("p", "alt-bilgi", "QR Kalkanı · Görüntü İşleme ve Derin Öğrenme ile Sahte QR Etiketi Tespiti · " + kimlik));
    main.appendChild(s);
  }

  // ---------------------------------------------------------------- başlat
  if (S.sahte) { sahteSayfa(); return; }
  main.appendChild(baslik());
  var govde = el("div", "govde");
  govde.appendChild((TURLER[S.tur] || function () { return bolumler(); })());
  var sa = saatler();
  if (sa) govde.appendChild(sa);
  if (S.tur !== "otopark" && S.not) govde.appendChild(el("p", "not", S.not));
  govde.appendChild(el("p", "alt-bilgi", S.isletme + " kurgusal bir işletmedir · QR Kalkanı bitirme projesi test sayfası · " + S.kimlik));
  main.appendChild(govde);
})();
