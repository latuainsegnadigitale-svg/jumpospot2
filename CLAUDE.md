# Jumbo Spot · JSE Insegne Digitali

Rispondi in italiano.

## Il progetto

Jumbo Spot è un sito statico pubblicato su Netlify, con accesso protetto e
ricerca di foto e video stock (Pixabay, Pexels, Unsplash) tramite la funzione
`guard.js`. Le istruzioni di pubblicazione sono in `LEGGIMI.txt`. Password e
chiavi API stanno nelle variabili d'ambiente di Netlify, mai nei file.

Problema aperto: `LEGGIMI.txt` e `netlify.toml` si aspettano il sito in
`public/` e la protezione in `netlify/edge-functions/guard.js`. Nel repo
invece i file sono tutti nella radice, quindi il deploy probabilmente non
funziona come previsto. Va sistemato spostando i file, non cambiando
`publish` in `"."`: altrimenti verrebbe pubblicata anche `.claude/`.

## Skill Instagram (`.claude/skills/ig-*`)

13 skill per i reel e i contenuti organici di Instagram (`/ig-reel`,
`/ig-profile`, `/ig-viral`, `/ig-plan`, ...). Fonte, licenza e modifiche
sono in `.claude/skills/INSTAGRAM-SKILLS.md`.

- Scrivono testi (ganci, copioni, scritte a schermo, didascalie, piani).
  Non producono video e non pubblicano nulla.
- Gli script di punteggio sono bilingui inglese + italiano. Le soglie
  ("sotto 50 non hai il gancio") sono tarate su ganci inglesi: per l'italiano
  sono un'indicazione, non un verdetto.
- I file personali (`voice.md`, `log.md`, `plan.md`, `swipe.md`) finiscono
  in `~/.claude/instagram/`, che nelle sessioni cloud si perde a fine
  sessione. `voice.md` non è ancora stato scritto: serve partire da tre reel
  dell'utente.

## Due lavori diversi

1. Reel organici per promuovere JSE Insegne Digitali: si usano le skill
   `ig-*`, l'utente gira e pubblica.
2. Spot da mandare in onda sulle insegne digitali dei clienti: le skill
   Instagram non servono. Si possono generare spot in motion graphics con
   `ffmpeg` (testo animato, logo, offerte, eventuale materiale stock),
   nella risoluzione esatta dell'insegna. Prima di iniziare chiedi
   risoluzione o proporzioni, durata, cliente, offerta, testi, colori e logo.
