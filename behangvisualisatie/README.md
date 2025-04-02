# Behangvisualisatie App

Een webapplicatie waarmee gebruikers kunnen visualiseren hoe een ruimte eruit zou zien met nieuw behang.

## Functionaliteiten

- Upload een foto van een ruimte (kamer, woonkamer, etc.)
- Upload een foto van een behangpatroon
- Genereer een fotorealistische visualisatie van de ruimte met het nieuwe behang
- Het resultaat behoudt alle details van de originele kamer, alleen de muren worden aangepast

## Technische Specificaties

- Frontend: HTML, CSS, JavaScript
- AI-beeldgeneratie: OpenAI DALL-E 3 API (directe integratie)
- Statische website (geen server nodig)

## Gebruik

1. Open `index.html` direct in je browser of host het bestand op een statische webserver
2. Voer je OpenAI API sleutel in (te verkrijgen op [platform.openai.com/api-keys](https://platform.openai.com/api-keys))
3. Upload een foto van je kamer
4. Upload een foto van het behangpatroon dat je wilt visualiseren
5. Klik op "Visualiseer behang"
6. Wacht tot de AI het resultaat heeft gegenereerd
7. Bekijk het resultaat!

## Privacy en Veiligheid

- De applicatie draait volledig in de browser
- Je API sleutel wordt alleen lokaal gebruikt en nergens opgeslagen
- De geüploade afbeeldingen worden alleen gebruikt voor het genereren van de visualisatie en worden niet permanent opgeslagen

## Installatie

Geen installatie nodig! Open het HTML-bestand in je browser en je kunt beginnen.

## Hosting

Je kunt deze app hosten op elke statische webhosting service zoals:
- GitHub Pages
- Netlify
- Vercel
- Amazon S3
- Google Cloud Storage
- Of gewoon lokaal gebruiken door het HTML-bestand te openen 