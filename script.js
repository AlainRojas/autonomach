import { syllabusData } from "./data.js"

// State variables
let currentView = "login"
let selectedTopic = null
let timerInterval = null
let timeLeft = 15 * 60 // 15 minutes in seconds
let userAnswers = {}
let currentQuizQuestions = []
let userEmail = null
let chatHistory = [] // To store chat messages for context

// --- START: AI Configuration ---
// WARNING: Storing API keys directly in client-side code is insecure.
// This should be handled by a backend proxy in a real application.
const API_KEY = "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" // User provided key
// IMPORTANT: Replace with the actual API endpoint URL for 'deekseep' or your provider
// Using OpenRouter as a placeholder for OpenAI-compatible APIs
const API_URL = "https://openrouter.ai/api/v1/chat/completions"
const AI_MODEL = "mistralai/mistral-7b-instruct:free" // Example model, adjust if needed
// --- END: AI Configuration ---

// Simulated database for users (in a real app, this would be in a secure database)
// This is just for demonstration - in production, use a real database like Supabase
const usersDB = [
  { email: "admin@autonoma.edu.pe", password: "admin123", name: "Administrador" },
  { email: "estudiante@autonoma.edu.pe", password: "estudiante123", name: "Estudiante Demo" },
]

// DOM Elements
const views = document.querySelectorAll(".view")
const loginView = document.getElementById("login-view")
const registerView = document.getElementById("register-view")
const topicSelectionView = document.getElementById("topic-selection-view")
const chatView = document.getElementById("chat-view")
const quizView = document.getElementById("quiz-view")
const resultsView = document.getElementById("results-view")

const emailInput = document.getElementById("email-input")
const passwordInput = document.getElementById("password-input")
const loginButton = document.getElementById("login-button")
const registerLinkButton = document.getElementById("register-link")
const loginError = document.getElementById("login-error")
const logoutButton = document.getElementById("logout-button")
const userEmailDisplay = document.getElementById("user-email-display")
const userNameDisplay = document.getElementById("user-name-display")

// Register form elements
const registerForm = document.getElementById("register-form")
const registerNameInput = document.getElementById("register-name-input")
const registerEmailInput = document.getElementById("register-email-input")
const registerPasswordInput = document.getElementById("register-password-input")
const registerConfirmPasswordInput = document.getElementById("register-confirm-password-input")
const registerButton = document.getElementById("register-button")
const registerError = document.getElementById("register-error")
const loginLinkButton = document.getElementById("login-link")

const topicList = document.getElementById("topic-list")
const chatTopicTitle = document.getElementById("chat-topic-title")
const chatTopicContext = document.getElementById("chat-topic-context") // Span for topic in intro message
const topicSummary = document.getElementById("topic-summary") // Still used for initial display
const startQuizButton = document.getElementById("start-quiz-button")
const chatBackButton = document.getElementById("chat-back-button")
// Chat specific elements
const chatMessages = document.getElementById("chat-messages")
const chatInput = document.getElementById("chat-input")
const sendChatButton = document.getElementById("send-chat-button")
const chatLoading = document.getElementById("chat-loading")
const chatError = document.getElementById("chat-error")

const quizTopicTitle = document.getElementById("quiz-topic-title")
const timerDisplay = document.getElementById("timer")
const quizForm = document.getElementById("quiz-form")
const submitQuizButton = document.getElementById("submit-quiz-button")
const quizMessage = document.getElementById("quiz-message")

const resultsTopicTitle = document.getElementById("results-topic-title")
const scoreDisplay = document.getElementById("score")
const resultsDetails = document.getElementById("results-details")
const recommendations = document.getElementById("recommendations")
const tryAgainButton = document.getElementById("try-again-button")
const resultsBackButton = document.getElementById("results-back-button")

// --- Functions ---

function showView(viewId) {
  views.forEach((view) => {
    view.classList.remove("active")
  })
  const activeView = document.getElementById(viewId)
  if (activeView) {
    activeView.classList.add("active")
    currentView = viewId
  } else {
    console.error("View not found:", viewId)
    // Fallback to login view if requested view doesn't exist
    document.getElementById("login-view").classList.add("active")
    currentView = "login"
  }
  // Scroll to top when changing views
  window.scrollTo(0, 0)
}

function validateEmail(email) {
  // Simple validation for @autonoma.edu.pe domain
  const re = /^[a-zA-Z0-9._%+-]+@autonoma\.edu\.pe$/
  return re.test(String(email).toLowerCase())
}

function handleLogin() {
  const email = emailInput.value.trim()
  const password = passwordInput.value // Get password
  loginError.textContent = "" // Clear previous errors

  if (!validateEmail(email)) {
    loginError.textContent = "Por favor, usa un correo válido (@autonoma.edu.pe)"
    return
  }

  if (password === "") {
    loginError.textContent = "Por favor, ingresa tu contraseña."
    return
  }

  // Check if user exists in our simulated database
  const user = usersDB.find((u) => u.email === email && u.password === password)

  if (!user) {
    loginError.textContent = "Credenciales incorrectas. Intenta nuevamente."
    return
  }

  userEmail = email
  // Store user session
  localStorage.setItem("userEmail", userEmail)
  localStorage.setItem("userName", user.name)

  userEmailDisplay.textContent = userEmail
  userNameDisplay.textContent = user.name

  loadTopics()
  showView("topic-selection-view")
  passwordInput.value = "" // Clear password field after login
}

// Update the handleRegister function to prevent form submission and add event listener
function handleRegister(event) {
  if (event) event.preventDefault()

  const name = registerNameInput.value.trim()
  const email = registerEmailInput.value.trim()
  const password = registerPasswordInput.value
  const confirmPassword = registerConfirmPasswordInput.value
  registerError.textContent = "" // Clear previous errors

  // Validate inputs
  if (!name) {
    registerError.textContent = "Por favor, ingresa tu nombre completo."
    return
  }

  if (!validateEmail(email)) {
    registerError.textContent = "Por favor, usa un correo válido (@autonoma.edu.pe)"
    return
  }

  if (password.length < 6) {
    registerError.textContent = "La contraseña debe tener al menos 6 caracteres."
    return
  }

  if (password !== confirmPassword) {
    registerError.textContent = "Las contraseñas no coinciden."
    return
  }

  // Check if user already exists
  if (usersDB.some((u) => u.email === email)) {
    registerError.textContent = "Este correo ya está registrado."
    return
  }

  // Add user to our simulated database
  usersDB.push({ email, password, name })

  // Show success message and redirect to login
  alert("¡Registro exitoso! Ahora puedes iniciar sesión.")
  showView("login-view")

  // Clear registration form
  registerNameInput.value = ""
  registerEmailInput.value = ""
  registerPasswordInput.value = ""
  registerConfirmPasswordInput.value = ""
}

// Update the event listener for the register form
if (registerForm) {
  registerForm.addEventListener("submit", handleRegister)
}

if (registerButton) {
  registerButton.addEventListener("click", handleRegister)
}

function handleLogout() {
  userEmail = null
  localStorage.removeItem("userEmail")
  localStorage.removeItem("userName")
  emailInput.value = "" // Clear input fields
  passwordInput.value = ""
  loginError.textContent = "" // Clear errors
  // Reset state if necessary
  selectedTopic = null
  userAnswers = {}
  stopTimer()
  chatHistory = [] // Clear chat history on logout
  showView("login-view")
}

function loadTopics() {
  topicList.innerHTML = "" // Clear previous topics
  syllabusData.topics.forEach((topic) => {
    const button = document.createElement("button")
    button.textContent = topic.title
    button.dataset.topicId = topic.id
    button.addEventListener("click", () => selectTopic(topic.id))
    topicList.appendChild(button)
  })
}

function selectTopic(topicId) {
  selectedTopic = syllabusData.topics.find((t) => t.id === topicId)
  if (selectedTopic) {
    chatTopicTitle.textContent = selectedTopic.title
    topicSummary.innerHTML = selectedTopic.summary
    chatTopicContext.textContent = selectedTopic.title // Update context in intro message

    // Reset chat for the new topic
    chatMessages.innerHTML = `
            <div class="message system-message">
                <p>Hola! Soy tu asistente para Metodología de la Investigación. Puedes preguntarme sobre el resumen del tema a continuación o cualquier duda que tengas sobre <strong>${selectedTopic.title}</strong>.</p>
            </div>
            <div class="message system-message">
                <strong>Resumen:</strong>
                <div>${selectedTopic.summary}</div>
            </div>` // Reset messages display
    chatInput.value = "" // Clear input
    chatError.textContent = "" // Clear errors
    chatHistory = [
      // Initialize chat history with system prompt and summary
      {
        role: "system",
        content: `Eres un asistente educativo especializado en Metodología de la Investigación Científica. 
        IMPORTANTE: SOLO debes responder preguntas relacionadas con el tema "${selectedTopic.title}". 
        Si el usuario pregunta sobre cualquier otro tema o solicita información no relacionada con este tema específico, 
        debes responder: "Lo siento, solo puedo responder preguntas relacionadas con ${selectedTopic.title}. 
        Estoy aquí para ayudarte a estudiar este tema específico. ¿Tienes alguna duda sobre ${selectedTopic.title}?".
        Sé claro, conciso y educativo en tus respuestas sobre el tema.`,
      },
      { role: "assistant", content: `Resumen del tema "${selectedTopic.title}": ${selectedTopic.summary}` }, // Add summary as context
    ]
    showView("chat-view")
  } else {
    console.error("Topic not found:", topicId)
    showView("topic-selection-view") // Go back if topic invalid
  }
}

function addMessageToChat(sender, text) {
  const messageDiv = document.createElement("div")
  messageDiv.classList.add("message", sender === "user" ? "user-message" : "ai-message")
  // Basic Markdown-like formatting for bold and lists
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
  text = text.replace(/(\n|^)\* (.*?)/g, "$1<ul><li>$2</li></ul>") // Initial list item
  text = text.replace(/<\/ul>\n<ul>/g, "") // Merge adjacent lists
  // Simple paragraph handling
  text = text
    .split("\n")
    .map((p) => (p.trim() ? `<p>${p}</p>` : ""))
    .join("")
  messageDiv.innerHTML = text // Use innerHTML to render basic HTML like <p>, <strong>, <ul>, <li>
  chatMessages.appendChild(messageDiv)
  // Scroll to the bottom
  chatMessages.scrollTop = chatMessages.scrollHeight

  // Add to chat history for API context (only if not a system message added internally)
  if (sender === "user" || sender === "ai") {
    chatHistory.push({ role: sender === "user" ? "user" : "assistant", content: text })
  }
}

// Función para simular respuestas de IA sin depender de una API externa
function simulateAIResponse(userMessage) {
  // Verificar si la pregunta está fuera del tema
  const lowerCaseMessage = userMessage.toLowerCase()
  const topicKeywords = selectedTopic.title.toLowerCase().split(" ")

  // Lista de palabras clave que indican que la pregunta podría estar fuera del tema
  const offTopicIndicators = [
    "política",
    "deportes",
    "cocina",
    "receta",
    "película",
    "música",
    "cantante",
    "actor",
    "actriz",
    "juego",
    "videojuego",
    "clima",
    "tiempo",
    "chiste",
    "broma",
    "cuéntame un chiste",
    "dime un chiste",
    "háblame de",
    "qué opinas de",
  ]

  // Verificar si la pregunta contiene indicadores de estar fuera del tema
  const isOffTopic =
    offTopicIndicators.some((indicator) => lowerCaseMessage.includes(indicator)) &&
    !topicKeywords.some((keyword) => lowerCaseMessage.includes(keyword))

  if (isOffTopic) {
    return `Lo siento, solo puedo responder preguntas relacionadas con ${selectedTopic.title}. Estoy aquí para ayudarte a estudiar este tema específico. ¿Tienes alguna duda sobre ${selectedTopic.title}?`
  }

  // Respuestas predefinidas basadas en palabras clave para el tema seleccionado
  const responses = {
    semana1: {
      sílabo:
        "El sílabo es un documento que presenta la estructura, contenidos, evaluación y reglas del curso. Es importante revisarlo para entender los objetivos de aprendizaje y las expectativas del curso.",
      normatividad:
        "La normatividad en investigación se refiere a las reglas y directrices éticas y legales que regulan la actividad investigadora. Estas normas aseguran que la investigación se realice de manera ética y responsable.",
      normas:
        "Las normas internacionales de escritura como APA y Vancouver buscan asegurar la uniformidad, claridad y facilitar la comprensión de la comunicación científica. Son estándares que permiten presentar la información de manera organizada.",
      citas:
        "Las citas son fundamentales para evitar el plagio y reconocer el trabajo de otros autores. Una cita correcta incluye el autor y año (en el texto), mientras que la referencia completa va al final del documento.",
      "método científico":
        "El método científico es un proceso sistemático, empírico y sujeto a revisión que incluye observación, pregunta, hipótesis, experimentación, análisis y conclusión. Es la base del conocimiento verificable.",
      plagio:
        "El plagio es presentar ideas, palabras o trabajos de otros como si fueran propios sin dar crédito. Es una falta ética grave en el ámbito académico que debe evitarse mediante la citación adecuada.",
    },
    semana2: {
      problema:
        "La formulación del problema implica expresarlo como una pregunta clara, delimitada y susceptible de ser investigada. Debe ser específico y viable.",
      justificación:
        "La justificación de una investigación responde a por qué es importante y relevante realizarla. Puede incluir relevancia social, implicaciones prácticas, valor teórico y utilidad metodológica.",
      objetivos:
        "Los objetivos de investigación deben comenzar con verbos en infinitivo (analizar, describir) y ser SMART: Específicos, Medibles, Alcanzables, Relevantes y con Tiempo definido.",
      smart:
        "SMART es un acrónimo para objetivos: Específicos (Specific), Medibles (Measurable), Alcanzables (Achievable), Relevantes (Relevant) y con Tiempo definido (Time-bound).",
      delimitación:
        "La delimitación del problema ayuda a especificar el alcance y los límites del estudio en términos temporales, espaciales y temáticos, haciendo la investigación más manejable.",
    },
    semana3: {
      búsqueda:
        "La búsqueda de información científica se realiza en bases de datos académicas como Scopus, Web of Science o Google Scholar, utilizando palabras clave y operadores booleanos.",
      antecedentes:
        "Los antecedentes de investigación analizan estudios previos relevantes, mostrando su relación con el problema actual. No solo resumen, sino que contextualizan nuestro trabajo.",
      teorías:
        "Las teorías que sustentan el estudio son los modelos conceptuales que explican el fenómeno estudiado. Proporcionan el marco interpretativo para nuestros hallazgos.",
      "marco teórico":
        "El marco teórico proporciona el sustento conceptual y contextual de la investigación, combinando antecedentes y bases teóricas para dar soporte a nuestro estudio.",
      "fuentes primarias":
        "Las fuentes primarias son artículos de investigación originales, tesis y reportes técnicos directos. Son preferibles a las fuentes secundarias por su originalidad.",
    },
    semana5: {
      justificación:
        "Al revisar la justificación, debemos confirmar que los argumentos sobre la importancia del estudio siguen siendo válidos y considerar si nueva evidencia refuerza o modifica nuestra justificación.",
      objetivos:
        "El refinamiento de objetivos asegura que sean SMART: Específicos, Medibles, Alcanzables, Relevantes y con Tiempo definido, ajustándolos según lo que hemos aprendido en la revisión de literatura.",
      "valor teórico":
        "El valor teórico en la justificación se refiere a la contribución del estudio al conocimiento existente en un campo teórico, cómo amplía, refuta o clarifica teorías previas.",
    },
    semana6: {
      diseño:
        "El diseño de investigación puede ser experimental, cuasi-experimental o no experimental (transversal o longitudinal), dependiendo de los objetivos y la naturaleza del problema.",
      población:
        "La población es el grupo total de interés para el estudio, mientras que la muestra es un subconjunto seleccionado de esa población sobre el cual recolectaremos datos.",
      hipótesis:
        "Una hipótesis es una suposición o respuesta tentativa a la pregunta de investigación, que se somete a prueba. No todos los estudios (como los descriptivos) requieren hipótesis.",
      variables:
        "Las variables son características o propiedades que mediremos o manipularemos. Deben definirse conceptual y operacionalmente para clarificar exactamente qué y cómo se medirán.",
      ética:
        "Los aspectos éticos incluyen el consentimiento informado, confidencialidad y manejo adecuado de datos. Aseguran que la investigación respete los derechos de los participantes.",
    },
    semana7: {
      operacionalización:
        "La operacionalización de variables es el proceso de definir cómo se medirá una variable conceptual, descomponiéndola en dimensiones e indicadores observables.",
      instrumentos:
        "La construcción de instrumentos implica diseñar cuestionarios, guías o herramientas basadas en la operacionalización, con ítems claros y escalas adecuadas.",
      validez:
        "La validez del instrumento se refiere a si mide realmente lo que pretende medir. Incluye validez de contenido, de constructo y de criterio.",
      confiabilidad:
        "La confiabilidad o fiabilidad se refiere a la consistencia y estabilidad de las mediciones. Un instrumento confiable produce resultados similares en aplicaciones repetidas.",
    },
  }

  // Obtener el ID del tema actual (semana1, semana2, etc.)
  const topicId = selectedTopic.id

  // Buscar palabras clave en el mensaje del usuario que coincidan con las respuestas predefinidas
  for (const keyword in responses[topicId]) {
    if (lowerCaseMessage.includes(keyword)) {
      return responses[topicId][keyword]
    }
  }

  // Respuesta genérica si no se encuentra una coincidencia específica
  return `Sobre ${selectedTopic.title}, es importante destacar que este tema aborda aspectos fundamentales de la metodología de investigación. 
  
  Te recomiendo revisar el resumen proporcionado y formular preguntas específicas sobre conceptos que no te queden claros. 
  
  ¿Hay algún aspecto particular de ${selectedTopic.title} sobre el que necesites más información?`
}

async function sendMessageToAI() {
  const userText = chatInput.value.trim()
  if (!userText || !selectedTopic) return

  addMessageToChat("user", userText)
  chatInput.value = "" // Clear input field
  chatLoading.style.display = "block" // Show loading indicator
  chatError.textContent = "" // Clear previous errors
  sendChatButton.disabled = true // Disable button while waiting
  chatInput.disabled = true

  try {
    // Simulamos un pequeño retraso para que parezca que está procesando
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Usar la función de simulación en lugar de la llamada a la API
    const aiResponse = simulateAIResponse(userText)

    // Mostrar la respuesta simulada
    addMessageToChat("ai", aiResponse)
  } catch (error) {
    console.error("Error en la simulación de respuesta:", error)
    chatError.textContent = `Error al procesar tu pregunta. Por favor, intenta de nuevo.`
  } finally {
    chatLoading.style.display = "none" // Hide loading indicator
    sendChatButton.disabled = false // Re-enable button
    chatInput.disabled = false
    chatInput.focus()
  }
}

function startQuiz() {
  if (!selectedTopic) return

  // Select 10 random questions if more are available, otherwise use all
  const allQuestions = selectedTopic.questions
  currentQuizQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10)

  quizTopicTitle.textContent = `Quiz: ${selectedTopic.title}`
  quizForm.innerHTML = "" // Clear previous form
  userAnswers = {} // Reset answers
  quizMessage.textContent = "" // Clear any previous messages

  currentQuizQuestions.forEach((q, index) => {
    const questionBlock = document.createElement("div")
    questionBlock.classList.add("question-block")

    const questionText = document.createElement("p")
    questionText.textContent = `${index + 1}. ${q.question}`
    questionBlock.appendChild(questionText)

    q.options.forEach((option, optionIndex) => {
      const label = document.createElement("label")
      const radio = document.createElement("input")
      radio.type = "radio"
      radio.name = `question-${index}`
      radio.value = optionIndex
      radio.id = `q${index}_opt${optionIndex}`
      // Add event listener to store answer immediately
      radio.addEventListener("change", () => {
        userAnswers[index] = Number.parseInt(radio.value, 10)
        console.log("Answer stored:", userAnswers)
      })

      label.appendChild(radio)
      label.appendChild(document.createTextNode(` ${option}`)) // Add space before option text
      questionBlock.appendChild(label)
    })
    quizForm.appendChild(questionBlock)
  })

  timeLeft = 15 * 60 // Reset timer to 15 minutes
  startTimer()
  showView("quiz-view")
}

function startTimer() {
  stopTimer() // Clear any existing timer
  timerInterval = setInterval(() => {
    timeLeft--
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    // Corrected the template literal and seconds formatting
    timerDisplay.innerHTML = `<i class="fas fa-clock"></i> Tiempo restante: ${minutes}:${seconds < 10 ? "0" + seconds : seconds}`

    if (timeLeft <= 0) {
      stopTimer()
      alert("¡Tiempo agotado!")
      submitQuiz(true) // Auto-submit when time runs out
    }
  }, 1000)
}

function stopTimer() {
  clearInterval(timerInterval)
  timerInterval = null
}

// Function to handle quiz submission (can be called by button or timer)
function submitQuiz(timeExpired = false) {
  stopTimer()

  let score = 0
  let unansweredQuestions = false
  resultsDetails.innerHTML = "" // Clear previous results

  // Check if all questions are answered if time hasn't expired
  if (!timeExpired) {
    for (let i = 0; i < currentQuizQuestions.length; i++) {
      if (userAnswers[i] === undefined) {
        unansweredQuestions = true
        break
      }
    }
  }

  if (unansweredQuestions) {
    quizMessage.textContent = "Por favor, responde todas las preguntas antes de finalizar."
    // Optionally restart timer if needed, or just leave it stopped
    // startTimer(); // Example: restart timer if you want to give them more time after warning
    return // Stop submission
  }

  quizMessage.textContent = "" // Clear message if all answered or time expired

  currentQuizQuestions.forEach((q, index) => {
    const userAnswerIndex = userAnswers[index]
    const correctAnswerIndex = q.correctAnswerIndex
    const isCorrect = userAnswerIndex === correctAnswerIndex

    if (isCorrect) {
      score++
    }

    // Display detailed result for each question
    const resultItem = document.createElement("div")
    resultItem.classList.add("result-item")
    resultItem.classList.add(isCorrect ? "correct" : "incorrect")

    const questionP = document.createElement("p")
    questionP.innerHTML = `<strong>Pregunta ${index + 1}:</strong> ${q.question}`
    resultItem.appendChild(questionP)

    const yourAnswerP = document.createElement("p")
    const userAnswerText = userAnswerIndex !== undefined ? q.options[userAnswerIndex] : "No respondida"
    yourAnswerP.innerHTML = `Tu respuesta: ${userAnswerText}`
    resultItem.appendChild(yourAnswerP)

    if (!isCorrect) {
      const correctAnswerP = document.createElement("p")
      correctAnswerP.innerHTML = `Respuesta correcta: ${q.options[correctAnswerIndex]}`
      resultItem.appendChild(correctAnswerP)
    }

    resultsDetails.appendChild(resultItem)
  })

  const finalScore = `${score} / ${currentQuizQuestions.length}`
  scoreDisplay.textContent = finalScore
  resultsTopicTitle.textContent = `Resultados: ${selectedTopic.title}`

  // Generate recommendations based on score
  let recommendationText = ""
  const percentage = (score / currentQuizQuestions.length) * 100
  if (percentage >= 80) {
    recommendationText = "¡Excelente trabajo! Has demostrado un buen dominio del tema."
  } else if (percentage >= 50) {
    recommendationText = "Buen intento. Repasa los puntos donde tuviste errores para reforzar tu conocimiento."
  } else {
    recommendationText =
      "Parece que necesitas repasar más a fondo este tema. Revisa el resumen y tus respuestas incorrectas."
  }
  recommendations.textContent = recommendationText

  showView("results-view")
}

// --- Event Listeners ---

// Login and Register navigation
if (registerLinkButton) {
  registerLinkButton.addEventListener("click", () => showView("register-view"))
}

if (loginLinkButton) {
  loginLinkButton.addEventListener("click", () => showView("login-view"))
}

// Login form
if (loginButton) {
  loginButton.addEventListener("click", handleLogin)
}

// Register form
if (registerForm) {
  registerForm.addEventListener("submit", handleRegister)
}

if (registerButton) {
  registerButton.addEventListener("click", handleRegister)
}

// Allow login on Enter key press in email or password input
if (emailInput) {
  emailInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  })
}

if (passwordInput) {
  passwordInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      handleLogin()
    }
  })
}

if (logoutButton) {
  logoutButton.addEventListener("click", handleLogout)
}

if (chatBackButton) {
  chatBackButton.addEventListener("click", () => {
    selectedTopic = null // Clear selected topic when going back
    chatHistory = [] // Clear chat history
    showView("topic-selection-view")
  })
}

// Chat send button listener
if (sendChatButton) {
  sendChatButton.addEventListener("click", sendMessageToAI)
}

// Allow sending chat message on Enter key press in textarea (Shift+Enter for new line)
if (chatInput) {
  chatInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault() // Prevent default Enter behavior (new line)
      sendMessageToAI()
    }
  })
}

if (startQuizButton) {
  startQuizButton.addEventListener("click", startQuiz)
}

if (submitQuizButton) {
  submitQuizButton.addEventListener("click", () => submitQuiz(false)) // Submit via button
}

if (resultsBackButton) {
  resultsBackButton.addEventListener("click", () => {
    selectedTopic = null // Clear selected topic
    userAnswers = {} // Reset answers
    showView("topic-selection-view")
  })
}

if (tryAgainButton) {
  tryAgainButton.addEventListener("click", () => {
    // Go back to the chat view for the same topic to restart the process
    if (selectedTopic) {
      chatTopicTitle.textContent = selectedTopic.title
      topicSummary.innerHTML = selectedTopic.summary
      userAnswers = {} // Reset answers
      showView("chat-view")
    } else {
      // Fallback if selectedTopic is somehow lost
      showView("topic-selection-view")
    }
  })
}

// --- Initialization ---

function initializeApp() {
  // Check for existing session
  const savedEmail = localStorage.getItem("userEmail")
  const savedName = localStorage.getItem("userName")

  if (savedEmail && validateEmail(savedEmail)) {
    userEmail = savedEmail
    userEmailDisplay.textContent = userEmail

    if (userNameDisplay && savedName) {
      userNameDisplay.textContent = savedName
    }

    loadTopics()
    showView("topic-selection-view") // Start at topic selection if logged in
  } else {
    showView("login-view")
  }
}

// Start the application
document.addEventListener("DOMContentLoaded", initializeApp)
