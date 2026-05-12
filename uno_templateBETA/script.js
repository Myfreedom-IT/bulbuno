// =====================
// ГЛОБАЛЬНОЕ СОСТОЯНИЕ ИГРЫ
// =====================

const state = {
  players: [
    {
      id: 1,
      name: 'Игрок',
      hand: [] // карты игрока
    },
    {
      id: 2,
      name: 'ИИ',
      hand: [] // карты ИИ
    },
    {
      id: 3,
      name: 'ИИ2',
      hand: [] // карты ИИ
    }
  ],
  deck: [],          // колода
  discardPile: [],   // стопка сброса (стол)
  currentPlayer: 0,  // чей ход (0 = игрок, 1 = ИИ)
  currentColor: null, // текущий цвет
  direction: 1,
  wins: 0,
  losses: 0
}


// =====================
// СОЗДАНИЕ КОЛОДЫ
// =====================

function createDeck() {
  const colors = ["red", "green", "blue", "yellow"]
  const values = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
  const specialValues = ['+2', 'rev', 'wild', '+4', 'skip']

  const deck = []

  for (const color of colors) {
    for (const value of values) {
      deck.push({ color, value })
    }

    for (const value of specialValues) {
      if (value === 'wild' || value === '+4') continue
      deck.push({ color, value })
    }
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ color: null, value: 'wild' })
    deck.push({ color: null, value: '+4' })
  }

  return deck
}


// =====================
// ПЕРЕМЕШИВАНИЕ КОЛОДЫ
// =====================

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

function drawCard() {
  if (state.deck.length === 0) {
    const top = state.discardPile.pop()

    state.deck = shuffle([...state.discardPile])
    state.discardPile = [top]
  }

  return state.deck.pop()
}

// =====================
// РАЗДАЧА КАРТ
// =====================

function dealCards(count = 7) {
  for (let i = 0; i < count; i++) {
    state.players.forEach(player => {
      const card = drawCard()
      if (card) {
        player.hand.push(card)
      }
    })
  }
}

// =====================
// ПРОВЕРКА: МОЖНО ЛИ ХОДИТЬ
// =====================

function canPlay(card, topCard, currentColor, playerIndex) {
  if (card.value === 'wild' || card.value === '+4') return true

  return (
    card.color === currentColor ||
    card.value === topCard.value
  )
}


// =====================
// СЫГРАТЬ КАРТУ
// =====================

function playCard(playerIndex, cardIndex) {
  const player = state.players[playerIndex]
  const card = player.hand[cardIndex]
  const topCard = state.discardPile[state.discardPile.length - 1]

  if (!card) return false
  if (!canPlay(card, topCard, state.currentColor, playerIndex)) return false

  let chosenColor = state.currentColor
  let skip = 1

  // reverse
  if (card.value === "rev") {
    state.direction *= -1
  }

  // skip
  if (card.value === "skip") {
    skip = 2
  }

  // +2
  if (card.value === "+2") {
    const next = (playerIndex + state.direction + state.players.length) % state.players.length
    const p = state.players[next]

    for (let i = 0; i < 2; i++) {
      const c = drawCard()
      if (c) p.hand.push(c)
    }
    skip = 2
  }

  // +4
  if (card.value === "+4") {
    const next = (playerIndex + state.direction + state.players.length) % state.players.length
    const p = state.players[next]

    for (let i = 0; i < 4; i++) {
      const c = drawCard()
      if (c) p.hand.push(c)
    }
    skip = 2
  }

  // выбор цвета
  if (card.value === 'wild' || card.value === '+4') {
    if (playerIndex === 0) {
      let chosen = prompt("Choose a color: red, green, blue, yellow")
      if (!chosen) chosen = "red"

      chosen = chosen.trim().toLowerCase()

      const map = {
        "red": "red", "r": "red",
        "green": "green", "g": "green",
        "blue": "blue", "b": "blue",
        "yellow": "yellow", "y": "yellow"
      }

      chosenColor = map[chosen] || "red"
    } else {
      const colorCount = {
        red: 0,
        green: 0,
        blue: 0,
        yellow: 0
      }

      // считаем цвета в руке ИИ
      player.hand.forEach(c => {
        if (c.color && colorCount[c.color] !== undefined) {
          colorCount[c.color]++
        }
      })

      // выбираем самый частый цвет
      chosenColor = Object.keys(colorCount).reduce((a, b) =>
        colorCount[a] > colorCount[b] ? a : b
      )
    }

  }

  // удаляем карту
  player.hand.splice(cardIndex, 1)
  state.discardPile.push(card)

  // обновляем текущий цвет
  state.currentColor = chosenColor

  // победа
  if (player.hand.length === 0) {

    if (playerIndex === 0) {
      state.wins++

      localStorage.setItem('wins', state.wins)
      localStorage.setItem('losses', state.losses)

      alert('Ты победил!')
    } else {
      state.losses++

      localStorage.setItem('wins', state.wins)
      localStorage.setItem('losses', state.losses)

      alert(`${player.name} победил`)
    }

    render()
    return true
  }

  // переход хода
  state.currentPlayer =
    (state.currentPlayer + state.direction * skip + state.players.length) %
    state.players.length

  return true
}

// =====================
// ИИ ХОД
// =====================

function aiTurn() {
  if (state.currentPlayer === 0) return

  const aiIndex = state.currentPlayer
  const ai = state.players[aiIndex]
  const topCard = state.discardPile[state.discardPile.length - 1]

  // ищем подходящую карту
  const playableIndex = ai.hand.findIndex(card =>
    canPlay(card, topCard, state.currentColor, aiIndex)
  )

  setTimeout(() => {
    if (playableIndex !== -1) {
      // играем карту
      playCard(aiIndex, playableIndex)
    } else {
      // берём карту
      const newCard = drawCard()
      if (newCard) ai.hand.push(newCard)

      state.currentPlayer = (state.currentPlayer + state.direction + state.players.length) % state.players.length
    }

    render()

    if (state.currentPlayer !== 0) {
      aiTurn()
    }
  }, 700)
}


// =====================
// РЕНДЕР (ОТРИСОВКА UI)
// =====================

function render() {
  const topCard = state.discardPile[state.discardPile.length - 1]

  const discardEl = document.getElementById('discard')
  const handEl = document.getElementById('player-hand')
  const aiCountEl = document.getElementById('ai-hand-count')
  const turnEl = document.getElementById('current-turn')

  // показываем верхнюю карту
  const displayColor = state.currentColor

  discardEl.textContent = topCard
    ? `${displayColor} ${topCard.value}`
    : 'Пусто'
  discardEl.style.backgroundSize = 'cover'

  discardEl.style.backgroundImage = `url(./png/${displayColor}.png)`

  aiCountEl.textContent = `
  ИИ1: ${state.players[1].hand.length} карт | 
  ИИ2: ${state.players[2].hand.length} карт
  `

  // показываем чей ход
  turnEl.textContent = `Ход: ${state.players[state.currentPlayer].name}`

  // очищаем руку игрока
  handEl.innerHTML = ''

  // рисуем карты игрока
  state.players[0].hand.forEach((card, index) => {
    const cardEl = document.createElement('div')
    cardEl.className = 'card player-card'

    // текст карты
    cardEl.textContent = `${card.color} ${card.value}`
    if (card.value === 'wild' || card.value === '+4') {
      cardEl.style.color = 'white'
      cardEl.textContent = `${card.value}`
    }
    cardEl.style.backgroundSize = 'cover'
    const color = card.color || 'wild'
    cardEl.style.backgroundImage = `url(./png/${color}.png)`

    // клик по карте
    cardEl.addEventListener('click', () => {
      if (state.currentPlayer !== 0) return

      const success = playCard(0, index)

      if (success) {
        render()
        aiTurn()
      }
    })

    handEl.appendChild(cardEl)
  })
}


// =====================
// ВЗЯТЬ КАРТУ
// =====================

document.getElementById('draw-btn').addEventListener('click', () => {
  if (state.currentPlayer !== 0) return

  const newCard = drawCard()

  if (newCard) {
    state.players[0].hand.push(newCard)
  }

  state.currentPlayer = 1

  render()
  aiTurn()
})


// =====================
// НОВАЯ ИГРА
// =====================

document.getElementById('restart-btn').addEventListener('click', initGame)


// =====================
// ИНИЦИАЛИЗАЦИЯ ИГРЫ
// =====================

function initGame() {
  state.deck = shuffle(createDeck())

  state.players.forEach(p => p.hand = [])

  dealCards()

  let firstCard
  const temp = []

  while (state.deck.length > 0) {
    const card = drawCard()

    if (!["+4", "wild", '+2', 'rev', 'skip'].includes(card.value)) {
      firstCard = card
      break
    }

    temp.push(card)
  }

  state.deck.push(...temp)

  state.discardPile = [firstCard]

  state.currentColor = firstCard.color
  state.currentPlayer = 0

  state.wins = Number(localStorage.getItem('wins')) || 0
  state.losses = Number(localStorage.getItem('losses')) || 0

  render()
}


// запуск при загрузке страницы
initGame()