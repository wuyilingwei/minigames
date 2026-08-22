const grid = document.querySelector('#game-grid');
const count = document.querySelector('#collection-count');

function createCard(game, index) {
  const article = document.createElement('article');
  article.className = `game-card game-card-${index + 1}`;

  const kicker = document.createElement('p');
  kicker.className = 'card-kicker';
  kicker.textContent = `${String(index + 1).padStart(2, '0')} · ${game.eyebrow}`;

  const title = document.createElement('h3');
  title.textContent = game.title;

  const description = document.createElement('p');
  description.className = 'card-description';
  description.textContent = game.description;

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const meta = document.createElement('span');
  meta.textContent = game.meta;

  const link = document.createElement('a');
  link.href = `./games/${game.slug}/`;
  link.textContent = game.action;
  link.setAttribute('aria-label', `${game.action}：${game.title}`);

  footer.append(meta, link);
  article.append(kicker, title, description, footer);
  return article;
}

async function renderCollection() {
  try {
    const response = await fetch('./games.json');
    if (!response.ok) throw new Error('Could not load collection');

    const games = await response.json();
    games.forEach((game, index) => grid.append(createCard(game, index)));
    count.textContent = `${String(games.length).padStart(2, '0')} 项已收录`;
  } catch {
    count.textContent = '目录暂不可用';
  }
}

renderCollection();

