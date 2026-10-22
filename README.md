# Luky TV DEA Music Community 🇸🇰

**Verejná stránka:** https://lukasjakubtv1-png.github.io/luky-tv-dea-music/

Svetlá mobilná hudobná platforma s automatickou synchronizáciou verejných piesní zo Suno, prehrávačom, žánrami, prehratiami, lajkami, vyhľadávaním a lokálnymi obľúbenými. Záložky: **Domov, Skladby, Chat, Správy, Profil**, komentáre pri jednotlivých skladbách.

## Prehrávač a auto-sync
- **Actions → Sync Suno and publish music → Run workflow** pre okamžitú aktualizáciu.
- Približne každú hodinu sa kontroluje Suno verejný profil @luky_tv_dea a aktualizuje sa `songs.json`.
- Automatický beh GitHub Actions sa môže oneskoriť.
- Údaje sú prevzaté z neoficiálneho verejného Suno API. Zmena jeho správania môže import zastaviť, ale posledný uložený katalóg zostane dostupný.
- Žánre sú približné kategórie vyhodnotené z hudobných štýlov skladieb.

## Bezplatná komunita: Supabase
GitHub Pages je iba statický hosting. **Chat, komentáre, súkromné správy a vlastné účty fungujú až po napojení bezplatnej Supabase databázy.**

1. Vytvor projekt v [Supabase](https://supabase.com/dashboard). V Authentication povol email sign-up.
2. Spusti súbor [supabase/schema.sql](supabase/schema.sql) cez **SQL Editor**. Skript vytvorí tabuľky s Row Level Security, ktorá chráni súkromné správy.
3. V **Project Settings → API** skopíruj **Project URL** a **anon / publishable key**.
4. Do [community-config.js](community-config.js) vlož tieto **verejné klientské hodnoty** (URL a publishable/anon key) a ulož commit. Nikdy tam nevkladaj `service_role` alebo iné tajné kľúče.
5. Po načítaní stránky sa zobrazí registrácia, chat, komentáre a súkromné správy. Potvrdenie e-mailu sa riadi nastavením Supabase Auth.

**Pôvodný Floot web:** https://lukytvdea.floot.app — obsahuje pôvodné účty, chat a historické správy. Na GitHub Pages sa automaticky **nepreniesli**. Ak používateľské dáta budeš chcieť presunúť, najprv je potrebná samostatná riadená migrácia a dôsledná kontrola ochrany osobných údajov. Heslá starých používateľov nemožno prenášať v otvorenej podobe; môžu sa musieť zaregistrovať nanovo.

### Bezpečnosť
- Nikdy nevkladaj osobné ani tajné prihlasovacie údaje do verejného repozitára.
- Ukladanie správ a prípadná moderácia budú podliehať limitom služby Supabase. Pred sprístupnením širšej komunite odporúčame riešiť moderovanie obsahu, antispam a súhlas s ochranou údajov.
