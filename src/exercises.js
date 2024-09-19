const exercises = [
  {
    text: 'Il programma deve scambiare il contenuto di due variabili numeriche <strong>v1</strong> e <strong>v2</strong>.',
    nodes: [
      {"type":"start","nodeType":"start","id":'A',"children":{"main":''}},
      {"type":"end","nodeType":"end","id":'B',"children":{"main":''}},
      {"type":"expression","nodeType":"operation","id":'C', "children":{"main":''},"expressions":["v1 = 10","v2 = 5","temp = -1"]},
      {"type":"expression","nodeType":"operation","id":'D', "children":{"main":''},"expressions":["temp = v1"]},
      {"type":"expression","nodeType":"operation","id":'E', "children":{"main":''},"expressions":["v1 = v2"]},
      {"type":"expression","nodeType":"operation","id":'F', "children":{"main":''},"expressions":["v2 = temp"]},
      {"type":"output","nodeType":"inputoutput","id":'G', "children":{"main":''},"output":"v1 = $v1; v2 = $v2"},
      {"type":"output","nodeType":"inputoutput","id":'H',"children":{"main":''},"output":"v1 = $v1; v2 = $v2"}
    ]
  },
  {
    text: 'Il programma deve stampare la somma di tutti i numeri <strong>pari</strong> compresi tra 1 e 140.',
    nodes:[
      {"type":"start","nodeType":"start","id":'',"children":{"main":''},},
      {"type":"end","nodeType":"end","id":'',"children":{"main":''}},
      {"type":"expression","nodeType":"operation","id":'',"children":{"main":''},"expressions":["n = 140","sum = 0","i = 1"],},
      {"type":"loop","nodeType":"condition","id":'',"children":{"yes":'',"no":'',"main":''},"condition":"i <= n"},
      {"type":"condition","nodeType":"condition","id":'',"children":{"yes":'',"no":'',"main":''},"condition":"i % 2 == 0",},
      {"type":"expression","nodeType":"operation","id":'',"children":{"main":''},"expressions":["sum = sum + i"]},
      {"type":"expression","nodeType":"operation","id":'',"children":{"main":''},"expressions":["i = i + 1"]},
      {"type":"output","nodeType":"inputoutput","id":'',"children":{"main":''},"output":"somma finale = $sum"}
    ]
  }
]

module.exports = exercises
