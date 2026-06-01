/* -----------------------------
   AI CLEANUP ENGINE
----------------------------- */

window.PasteLintAI = (() => {
  function cleanAIPhrases(text = "") {
    return String(text)

      // Phrase-level cleanup
      .replace(/\bit is important to note that\b/gi, "")
      .replace(/\bit should be noted that\b/gi, "")
      .replace(/\bit is worth noting that\b/gi, "")
      .replace(/\bit is essential to understand that\b/gi, "")
      .replace(/\bleveraging this comprehensive solution\b/gi, "using this approach")
      .replace(/\bthis comprehensive solution\b/gi, "this approach")
      .replace(/\bdrive meaningful outcomes\b/gi, "get results")
      .replace(/\bdrive outcomes\b/gi, "improve results")
      .replace(/\bplays a crucial role in ensuring\b/gi, "helps")
      .replace(/\bfacilitate improved\b/gi, "improve")
      .replace(/\bin order to\b/gi, "to")
      .replace(/\bfor the purpose of\b/gi, "for")
      .replace(/\bin the event that\b/gi, "if")

      // Corporate / AI-style wording
      .replace(/\bleveraging\b/gi, "using")
      .replace(/\bleverage\b/gi, "use")
      .replace(/\butilizing\b/gi, "using")
      .replace(/\butilize\b/gi, "use")
      .replace(/\butilized\b/gi, "used")
      .replace(/\bnavigating\b/gi, "handling")
      .replace(/\bnavigate\b/gi, "handle")
      .replace(/\bdelve into\b/gi, "explore")
      .replace(/\bunlock\b/gi, "gain")
      .replace(/\bempower\b/gi, "help")
      .replace(/\bfacilitate\b/gi, "help")

      // Common inflated phrases
      .replace(/\bcomprehensive solution\b/gi, "solution")
      .replace(/\brobust solution\b/gi, "solution")
      .replace(/\bdynamic landscape\b/gi, "changing environment")
      .replace(/\bever-evolving\b/gi, "changing")
      .replace(/\bmeaningful outcomes\b/gi, "results")

      // Cleanup
      .replace(/\bimprove communication and improve results\b/gi, "improve communication and results")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .replace(/^\s*,?\s*/, "")
      .trim();
  }

  function clean(text = "") {
    return cleanAIPhrases(text);
  }

  return {
    clean,
    cleanAIPhrases
  };
})();
