# Luky TV DEA Music Community 🇸🇰

Svetlá bielo-modrá hudobná stránka s verejnými skladbami profilu [@luky_tv_dea na Suno](https://suno.com/@luky_tv_dea).

## Odkazy

- **Web po aktivovaní GitHub Pages:** https://lukasjakubtv1-png.github.io/luky-tv-dea-music/
- **Suno:** https://suno.com/@luky_tv_dea

## Zapnutie publikovania na GitHube

1. Otvoriť **Settings → Pages**.
2. Nastaviť **Build and deployment → Source: GitHub Actions**.
3. Otvoriť záložku **Actions**, workflow **Sync Suno and publish music**, prípadne kliknúť **Run workflow**.
4. Po dokončení úspešného behu otvoriť webovú adresu vyššie.

Workflow sa plánuje na 17. minútu každej hodiny; GitHub môže naplánovaný beh oneskoriť. Ručné spustenie je možné cez **Actions → Run workflow**.

## Čo stránka obsahuje

- Vlastný audio prehrávač so seek časovou osou a ovládaním
- Obaly skladieb, vyhľadávanie, triedenie a jednoduché žánrové kategórie odvodené z hudobného opisu
- Prehratia a lajky prevzaté zo Suno, s aktualizáciou pri synchronizácii
- Lokálne obľúbené piesne (bez registračného účtu)
- Mobilné zobrazenie a jednoduché zdieľanie

## Dôležité

Suno momentálne poskytuje údaje cez *neoficiálne* verejné rozhranie. Ak zmení schému, obmedzí požiadavky alebo zablokuje GitHub servery, automatická synchronizácia prestane fungovať; workflow bezpečne zachová posledný platný katalóg. Počty prehratí a lajkov sa neaktualizujú okamžite. Žáner je orientačný odhad z popisu tvorcu, nie oficiálna kategória Suno.

Tento samostatný statický web **neprenáša chat, používateľské účty, komentáre ani databázu z pôvodnej stránky Floot**. Pôvodný Floot web ostáva nedotknutý.

Pri chybe synchronizácie skontrolovať logy v záložke **Actions**.
