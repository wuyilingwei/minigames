const grid = document.querySelector('#game-grid');
const count = document.querySelector('#collection-count');

function createCard(game, index) {
  const article = document.createElement('article');
  article.className = `game-card game-card-${index + 1}`;

  if (game.cover) {
    article.classList.add('has-cover');

    const cover = document.createElement('img');
    cover.className = 'card-cover';
    cover.src = game.cover;
    cover.alt = game.coverAlt || `${game.title} 预览图`;
    cover.decoding = 'async';
    article.append(cover);
  }

  const kicker = document.createElement('p');
  kicker.className = 'card-kicker';
  kicker.textContent = `${String(index + 1).padStart(2, '0')} · ${game.eyebrow}`;

  const title = document.createElement('h3');
  title.textContent = game.title;

  const description = document.createElement('p');
  description.className = 'card-description';
  description.textContent = game.description;

  const credit = document.createElement('p');
  credit.className = 'card-credit';
  credit.textContent = game.credit;

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const meta = document.createElement('span');
  meta.textContent = game.meta;

  const link = document.createElement('a');
  link.href = `./games/${game.slug}/`;
  link.textContent = game.action;
  link.setAttribute('aria-label', `${game.action}：${game.title}`);

  footer.append(meta, link);
  article.append(kicker, title, description, credit, footer);
  return article;
}

async function renderCollection() {
  try {
    const response = await fetch('./games.json');
    if (!response.ok) throw new Error('Could not load collection');

    const games = await response.json();
    games.forEach((game, index) => grid.append(createCard(game, index)));
    count.textContent = `${String(games.length).padStart(2, '0')} 款游戏`;
  } catch {
    count.textContent = '目录暂不可用';
  }
}

renderCollection();
