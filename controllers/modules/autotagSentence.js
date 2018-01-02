function autotagSentence(originalSentence, keywords, separators) {
  let splitSentence;
  const foundKeywords = [];
  const pattern = [];
  const asAnArray = [];
  let wordsToCheck;
  let nbOfKeywords;
  // let foundIndex;

  keywords.map((keyword) => {
    nbOfKeywords = keyword.text.split(' ').length;
    splitSentence = originalSentence.split(separators[0]);
    splitSentence.map((word, i, words) => {
      wordsToCheck = words.slice(i, i + nbOfKeywords);
      // console.log('wordsToCheck: ', wordsToCheck);
      if (wordsToCheck.join(separators[0]) === keyword.text) {
        foundKeywords.push({
          text: wordsToCheck.join(' '),
          TagId: keyword.TagId,
          tag: keyword.tag,
        });
        // asAnArray.push(wordsToCheck.join(separators[0]));
        pattern.push(originalSentence.replace(keyword.text, `<${keyword.tag}>`));
        splitSentence[i] = splitSentence.splice(i, nbOfKeywords, keyword.text).join(separators[0]);
        asAnArray.push(splitSentence);
      }
      return null;
    });
    return foundKeywords;
  });

  // si aucun keyword trouvé
  if (asAnArray.length === 0) {
    asAnArray[0] = splitSentence;
  }

  // foundKeywords est la donnée principale.
  // pattern et asAnArray sont seulement dérivées des deux autres.
  const myobject = {
    foundKeywords, pattern, asAnArray, originalSentence,
  };
  console.log('myobject: ', myobject);
  return myobject;
}

module.exports = autotagSentence;
