export const questionnaireQuestions = [
  {
    name: "perfil",
    question: "1. Você é:",
    options: [
      "Paciente de câncer de mama",
      "Paciente de outro tipo de câncer",
      "Familiar ou cuidador de pessoa com câncer",
      "Profissional de saúde",
      "Representante de OSC",
      "Interessado no tema",
    ],
  },
  {
    name: "idade",
    question: "2. Qual é a sua idade?",
    options: [
      "Entre 18 e 30 anos",
      "Entre 31 e 40 anos",
      "Entre 40 e 50 anos",
      "Entre 50 e 60 anos",
      ">60 anos",
    ],
  },
  {
    name: "regiao",
    question: "3. De onde você é?",
    options: [
      "Região Norte do Brasil",
      "Região Nordeste do Brasil",
      "Região Centro-Oeste do Brasil",
      "Região Sudeste do Brasil",
      "Região Sul do Brasil",
      "Exterior do Brasil",
    ],
  },
  {
    name: "adjuvante_neoadjuvante",
    question:
      "4. Sobre o tratamento do câncer de mama, você sabe a diferença entre tratamento adjuvante e neoadjuvante?",
    description:
      "Neoadjuvante: realizado antes da cirurgia para diminuir o tumor e avaliar a resposta do tratamento. Adjuvante: realizado após a cirurgia com o objetivo de eliminar a doença e reduzir o risco de reincidência.",
    options: ["Sim", "Não"],
  },
  {
    name: "recidiva",
    question: "5. Você sabe o que significa recidiva?",
    description:
      "Recidiva: retorno de uma doença após um período de remissão ou aparente cura.",
    options: ["Sim", "Não"],
  },
  {
    name: "metastase",
    question: "6. Você sabe o que é uma metástase?",
    description:
      "Metástase: ocorre quando as células do câncer se espalham para diferentes partes do corpo.",
    options: ["Sim", "Não"],
  },
  {
    name: "tratamento_previne",
    question:
      "7. Você sabia que o tratamento adequado do câncer em estágio inicial pode prevenir, em muitos casos, a recidiva ou a metástase?",
    options: ["Sim", "Não"],
  },
  {
    name: "jornada_unica",
    question:
      "8. Você sabia que a jornada de cada paciente oncológico é única e o tratamento pode ser diferente para cada caso?",
    options: ["Sim", "Não"],
  },
  {
    name: "opcoes_todos_estagios",
    question:
      "9. Você sabia que em todos os estágios do câncer, inclusive quando a doença reaparece ou invade outras partes do corpo, existem opções de tratamento e/ou controle da doença?",
    options: ["Sim", "Não"],
  },
  {
    name: "conhecer_opcoes",
    question:
      "10. Você considera que conhecer as opções de tratamento do câncer pode diminuir a ansiedade relacionada ao diagnóstico ou acompanhamento médico da doença?",
    options: ["Sim", "Não"],
  },
];

export function useQuestionnaireForm() {
  const items = questionnaireQuestions.map(({ name }) => ({
    name,
    required: true,
  }));

  function getInitialItem() {
    return questionnaireQuestions[0]?.name;
  }

  function getAnswers(formData) {
    return questionnaireQuestions.reduce((answers, question) => {
      answers[question.name] = formData.get(question.name);
      return answers;
    }, {});
  }

  return {
    getAnswers,
    getInitialItem,
    items,
    questions: questionnaireQuestions,
  };
}
