# 🚲 Girocleta - Mapa d'Estacions en Temps Real

Aplicació web moderna, interactiva i a pantalla completa per consultar la disponibilitat de bicicletes i aparcaments lliures del servei **Girocleta** (Girona) en temps real, amb suport per a personalització d'usuari i alertes / notificacions push programables.

---

## ✨ Característiques Principals

- **🗺️ Mapa interactiu a pantalla completa**:
  - Cartografia suau i optimitzada amb Leaflet i CartoDB Voyager.
  - Indicadors dobles (Dual-Badges) a cada marcador mostrant simultàniament **bicicletes disponibles (🚲)** i **llocs lliures (🅿️)**.
  - Codificació semàfor de colors dinàmica (verd, groc, vermell) segons la disponibilitat.
  - Informació detallada en popup de cada estació amb adreça, capacitat total i botó directe per desar a preferides.

- **⭐ Estacions Preferides Personalitzades**:
  - Desa les teves estacions habituals amb un sol clic (icona d'estrella).
  - Marcador daurat distintiu al mapa per a les teves estacions preferides.
  - Pestanya de filtre ràpid i comptador directe de preferides a la barra de navegació.
  - Emmagatzematge persistent al dispositiu de l'usuari (`localStorage`).

- **🔔 Sistema de Notificacions Push i Alertes**:
  - **Triar estacions a monitoritzar**:
    - Mode *Totes les meves preferides*.
    - Mode *Selecció manual d'estacions* (llistat amb cerca i checkboxes de les 36 estacions).
  - **Programació horària flexible**:
    - **Hores específiques**: afegeix o elimina hores fixes d'avís (ex. `08:00`, `14:00`, `19:00`).
    - **Interval periòdic**: rep un avís cada 15, 30 o 60 minuts dins de la franja horària desitjada (ex. de 07:30 a 21:30).
  - **Repetició per dies**:
    - Dies laborables (Dilluns a Divendres).
    - Tots els dies.
    - Caps de setmana.
  - **Contingut exacte de l'avís**:
    - Indica el nombre de bicicletes disponibles (🚲) i aparcaments buits (🅿️).
  - **Filtres condicionals intel·ligents (opcional)**:
    - Avisar només si queden menys d'un determinat nombre de bicicletes o places lliures.
  - **Previsualització en viu**: Targeta interactiva amb l'aspecte real de la notificació al dispositiu.
  - **Botó de prova immediata**: Comprova a l'instant com rep el teu navegador la notificació push.

- **📍 Geolocalització & Estacions més properes**:
  - Troba les estacions més a prop de la teva posició actual ordenades per distància a peu.

- **📱 Progressive Web App (PWA)**:
  - Service Worker (`sw.js`) per a memòria cau, funcionament offline i gestió de notificacions push.
  - Instal·lable a la pantalla d'inici (iOS, Android, macOS, Windows) amb manifest web (`manifest.json`).

---

## 🚀 Tecnologies Utilitzades

- **HTML5 & CSS3**: Disseny glassmòrfic modern amb variables CSS, responsive per a mòbil i escriptori.
- **JavaScript (ES6+)**: Sense frameworks pesants, ràpid, autònom i lleuger.
- **Leaflet.js**: Motor de mapes d'alt rendiment.
- **Service Worker & Notification API**: Notificacions push natives al navegador.
- **CityBik API**: Integració amb les dades oficials obertes en viu de la Girocleta.

---

## 🛠️ Com executar en local

Pots servir els fitxers estàtics amb qualsevol servidor web:

```bash
# Amb Python 3
python3 -m http.server 8089

# O amb Ruby
ruby -run -e httpd . -p 8089
```

I obrir al navegador: `http://localhost:8089/`
