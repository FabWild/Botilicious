const models = require('../../models');
const axios = require('axios');

// simple naive arithmetic parser, many operands
function operations(arrayOfNumbers = [], operand = '') {
  return arrayOfNumbers.reduce((acc, current) => {
    switch (operand) {
      default: return acc + current;
      case '+': return acc + current;
      case '-': return acc - current;
      case '*': return acc * current;
      case '/': return acc / current;
    }
  });
}

// fonction qui retourne une promesse. Celle-ci est le call d'api.
function apiCall(moduleName, splitMessage) {
  return new Promise(((resolve, reject) => {
    if (moduleName) {
      const message = splitMessage;
      const myparams = { where: { name: moduleName } };

      console.log('myparams', myparams);

      models.Module
        .find(myparams)
        .then((results) => {
          // former l'objet params attendu par axios
          const params = {};

          let args = {
            parameters: [],
            inputs: [],
          };

          // module meteo, démo sprint 1, traitement des arguments en dur
          if (message[0] === 'meteo') {
            console.log('meteo, module en dur');
            const dayWords = [{
              text: 'après-demain',
              time: '2',
            }, {
              text: 'demain',
              time: '1',
            }];
            if (message[2]) {
              dayWords.forEach((dayWord) => {
              // console.log(dayWord);
                message[2] = message[2].replace(dayWord.text, dayWord.time);
              // console.log(message[2]);
              });
            }

            // const rand = [Math.floor(Math.random() * res.length)];
            let time;
            let errorMessage;

            if (message.length === 4 && typeof (parseInt(message[2], 10)) === 'number' && typeof (parseInt(message[3], 10)) === 'number') {
              time = (8 * message[2]) + Math.round(message[3] / 3);
            } else if (message.length === 3 && typeof (parseInt(message[2], 10)) === 'number') {
              time = 8 * message[2];
            } else {
              console.log('Syntaxe du time meteo incorrecte');
              time = 0;
              errorMessage = 'Votre syntaxe est incorrecte';
            }
            if (time > 39) {
              time = 39;
            }
            console.log('time:', time);
            if (isNaN(time)) {
              console.log('NaN');
              errorMessage = 'Votre syntaxe est incorrecte';
              time = 0;
            }
            args = {
              parameters:
            [{
              tag: 'place',
              value: message[1],
            }],
              inputs:
            [{
              tag: 'time',
              value: time,
            }],
            };
          } else {
            // fin du else 'meteo', il peut se fermer aussi tout en bas

            // on récupère dans la session les valeurs stockées lors de la conversation
          }
          console.log('results.dataValues: ', results.dataValues);

          // on prend le json 'api' dans la bdd
          const api = JSON.parse(results.dataValues.api);

          // console.log('api :', Object.keys(api.parameters).length);
          // console.log('api :', Object.keys(args.parameters).length);

          // voir s'il manque des paramètres pour passer le call d'api
          // if (Object.keys(api.parameters.filter(element => element.type === 'out')).length !== Object.keys(args.parameters).length) {
          //   reject(new Error('Erreur - pas le bon nombre d\'arguments'));
          // } else {
          // adaptateur : mapper les arguments reçus sur le modèle attendu
          api.parameters
            .filter(apiParameter => apiParameter.type === 'out')
            .map((apiParameter, i) => {
              console.log('args.parameters[i]: ', args.parameters[i]);
              params[apiParameter.text] = args.parameters[i].value;
            });

          console.log('params: ', params);

          // ajouter les paramètres fixes (tokens, logins, etc...)
          api.fixed.map((apiParameter) => {
            params[apiParameter.text] = apiParameter.value;
          });
          // console.log('params: ', params);

          // récupérer l'url de l'api (dans l'objet api issu de la bdd)
          const url = api.url;
          console.log('url: ', url);

          // appeler l'api
          axios.get(url, { params })
            .then((response) => {
              console.log('response.data: ', response.data);
              // prendre dans la réponse les éléments listés dans la bdd

              const replyToSend = { answerPattern: api.answer, answer: api.answer };

              console.log('api: ', api);
              // console.log(response.data.city.name);
              console.log(args.inputs.map(input => input));


              api.parameters
                .filter(parameter => parameter.type === 'in')
                .map((parameter) => {
                  let tempResponse = response.data;
                  const tempParameter = parameter;

                  console.log('args.inputs.length: ', args.inputs.length);
                  // les valeurs reçues en argument sont placées
                  args.inputs.map((input) => {
                    tempParameter.value = tempParameter.value.replace(input.tag, input.value);
                    console.log('tempParameter: ', tempParameter);
                  });

                  tempParameter.value.split('.')
                    .map((key) => {
                      console.log('key: ', key);
                      let tempKey = key;

                      const arrayIndexInKey = key.match(/\[[0-9]+\]/gi);
                      if (arrayIndexInKey) {
                        console.log('arrayIndexInKey: ', arrayIndexInKey);

                        const actualIndex = arrayIndexInKey[0].substring(1, arrayIndexInKey[0].length - 1);
                        console.log('actualIndex: ', actualIndex);
                        tempKey = key.slice(0, key.indexOf(actualIndex) - 1);
                        console.log('tempKey: ', tempKey);

                        const tempArray = tempResponse[tempKey];
                        tempResponse = tempArray[actualIndex];
                        // console.log('tempArray[actualIndex]: ', tempResponse);
                      } else {
                        const re = /-|\+|\*|\//;
                        console.log('tempKey: ', tempKey);
                        console.log(tempKey.match());
                        const actualKey = tempKey.match(re);
                        const operatorIndex = [tempKey.search(re)];
                        const rightOperand = parseInt(tempKey.split(re).slice(1), 10);
                        if (actualKey) {
                          console.log('actualKey: ', actualKey);
                          console.log('operatorIndex: ', operatorIndex);
                          console.log('tempKey.split(//)', tempKey.split(re));
                          tempKey = tempKey.split(re)[0];
                          console.log('tempKey2: ', tempKey);
                          console.log('rightOperand: ', rightOperand);
                        }
                        tempResponse = tempResponse[tempKey];
                        console.log('tempResponse: ', tempResponse);
                        if (actualKey) {
                          console.log('tempKey[operatorIndex]: ', key[operatorIndex]);
                          tempResponse = Math.round(100 * operations([tempResponse, rightOperand], key[operatorIndex])) / 100;
                        }
                      }
                      // results.data => results.data.name => results.data.name.city
                      return tempResponse;
                    });
                  console.log(tempResponse);
                  console.log(`<${tempParameter.tag}>`);
                  replyToSend.answer = replyToSend.answer.replace(`<${tempParameter.tag}>`, tempResponse);
                });
              console.log('replyToSend: ', replyToSend);
              // return replyToSend;
              resolve(replyToSend);
            })
            .catch((error) => {
              console.log('Error api: ', error);
              reject(error);
            });
          // fermeture du if qui teste le nb d'arguments
          // }
          // fermeture du else après if meteo
          // }
        })
        .catch((error) => {
          console.log('Error bdd: ', error);
          reject(error);
        });
    }
  }));
}

module.exports = apiCall;
