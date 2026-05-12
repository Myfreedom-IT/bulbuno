const wins = Number(localStorage.getItem('wins')) || 0
const losses = Number(localStorage.getItem('losses')) || 0

const statNumbers = document.querySelectorAll('.stat-number-strict')

statNumbers[0].textContent = losses
statNumbers[1].textContent = wins