# Skill Instagram (ig-*)

Le 13 cartelle `ig-*` vengono da
https://github.com/Jakeschincariol/instagram-agent-skill
(commit `d03c56bb598be770c60b201f94237e5d1a4268a6`, licenza MIT, vedi
`LICENSE-instagram-agent-skill`). `voice.template.md` è il modello di
`voice.md` dello stesso repository.

## Modifiche rispetto all'originale

Gli script e i file dati sono stati resi bilingui (inglese + italiano). Sui
testi inglesi i risultati non cambiano, tranne `beats.py`, che ora conta come
concreti anche i numeri scritti in lettere ("five hours").

- `ig-reel/hookscore.py`: lettere accentate, euro e "18.000", numeri in
  lettere, parole di tensione, aperture deboli, imperativi, saluti e
  preamboli in italiano, seconda persona italiana.
- `ig-reel/beats.py`: stopword italiane, euro, numeri in lettere.
- `ig-reel/hooks.json`: ogni formula ha anche pattern italiani (`match_it`,
  già inclusi in `match`), usati da `ig-viral/swipe.py` per classificare.
- `ig-human/slop.json`: voci con `"lang": "it"` (parole, frasi, strutture
  tipiche dei testi generati in italiano) e virgolette « ».
- `ig-human/detect.py`: elisioni e intercalari parlati al posto delle
  contrazioni inglesi, pronomi italiani, lettere accentate.
- `ig-human/humanize.py`, `ig-caption/caption.py`, `ig-viral/swipe.py`:
  connettivi, inviti all'azione e hashtag generici in italiano.

I punteggi restano euristiche. Le soglie sono state tarate dall'autore su
ganci inglesi e non sono state ritarate sull'italiano.

## File personali

Le skill leggono e scrivono `~/.claude/instagram/` (`voice.md`, `log.md`,
`swipe.md`, `plan.md`). Nelle sessioni cloud quella cartella si perde a fine
sessione: salvane una copia altrove se vuoi conservarli.
