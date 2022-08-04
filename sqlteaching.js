var sql = window.SQL;
// The db variable gets set every time a level is loaded.
var db;

// Return an HTML table as a string, given SQL.js results
var table_from_results = function(res) {
  var table_string = '<table>';
  if (res) {
    table_string += '<tr>';
    for (var index in res[0].columns) {
      table_string += '<th>' + res[0].columns[index] + '</th>';
    }
    table_string += '</tr>';
    for (var row_index in res[0].values) {
      table_string += '<tr>';
      for (var col_index in res[0].values[row_index]) {
        table_string += '<td>' + res[0].values[row_index][col_index] + '</td>';
      }
      table_string += '</tr>';
    }
  }
  table_string += '</table>';
  return table_string;
};

var grade_results = function(results, correct_answer) {
  if (!results) {
    return false;
  }

  // Check to make sure the results are equal, but normalize case and remove whitespace from column names.
  var normalize = function(x){return x.toUpperCase().replace(/\s/g, "")};
  return JSON.stringify(results[0].columns.map(normalize)) == JSON.stringify(correct_answer.columns.map(normalize)) &&
    JSON.stringify(results[0].values) == JSON.stringify(correct_answer.values);
};

var show_is_correct = function(is_correct, custom_error_message) {
  if (is_correct) {
    is_correct_html = 'Parabéns! Está correto<br/>';
    if (current_level < levels.length) {
      is_correct_html += '<a href="#!' + levels[current_level]['short_name'] + '" tabindex="3">Próxima Lição</a>';
    } else {
      is_correct_html += 'Esse é o fim do Tutorial';
    }
    $('#answer-correct').html(is_correct_html);
    $('#answer-correct').show();
    $('#answer-wrong').hide();
  } else if (custom_error_message) {
    $('#answer-wrong').text(custom_error_message);
    $('#answer-wrong').show();
    $('#answer-correct').hide();
  } else {
    $('#answer-wrong').text('Errado. Tente novamente.');
    $('#answer-wrong').show();
    $('#answer-correct').hide();
  }
};

var strings_present = function(strings) {
  var ans = $('#sql-input').val().toLowerCase();
  for (var index in strings) {
    if (ans.indexOf(strings[index].toLowerCase()) < 0) {
      return false;
    }
  }
  return true;
};

var execute_query = function() {
  var cur_level = levels[current_level-1];
  var correct_answer = cur_level['answer'];
  try {
    var results = db.exec($('#sql-input').val());
    if (results.length == 0) {
      $('#results').html('');
      show_is_correct(false, 'A consulta não apresentou nenhum resultado. Tente novamente.');
    } else {
      $('#results').html(table_from_results(results));
      var is_correct = grade_results(results, correct_answer);
      if (is_correct) {
        // The required strings are optional, but if they exist and it fails, we show a custom error message.
        if (!cur_level['required'] || strings_present(cur_level['required'])) {
          show_is_correct(true, null);
          localStorage.setItem('completed-' + cur_level['short_name'], 'correct');
          // By calling render_menu, the completed level gets a checkmark added
          render_menu();
        } else {
          show_is_correct(false, cur_level['custom_error_message']);
        }
      } else {
        show_is_correct(false, 'A consulta que você fez não apresentou um resultado correto. Tente novamente.');
      }
    }
  } catch (err) {
    $('#results').html('');
    show_is_correct(false, 'A consulta que você fez não é válida. Tente novamente.');
  }
  $('.expected-results-container').show();
  $('#expected-results').html(table_from_results([correct_answer]));
  return false;
};

// Onclick handler for when you click "Run SQL"
$('#sql-link').click(execute_query);

// Keypress handler for ctrl + enter to "Run SQL"
$('#sql-input').keypress(function(event) {
  var keyCode = (event.which ? event.which : event.keyCode);

  if (keyCode === 10 || keyCode == 13 && event.ctrlKey) {
    execute_query();
    return false;
  }
});

/**
 * This variable has the prompts and answers for each level.
 *
 * It is an array of dictionaries.  In each dictionary, there are the following keys:
 *  - name:          name shown on web page
 *  - short_name:    identifier added to the URL
 *  - database_type: is passed into the load_database function, in order to determine the tables loaded
 *  - answer:        the query that the user writes must return data that matches this value
 *  - prompt:        what is shown to the user in that web page
 *
 * And the following keys are optional:
 *  - required:             Extra validation in the form of case-insensitive required strings
 *  - custom_error_message: If the validation fails, show this error message to the user
 */
var levels = [{'name': 'SELECT',
               'short_name': 'select',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Placa'],
                          'values': [['LLL0000'],
                                     ['LXZ3333']]},
               'prompt': '<br/>Quais são as placas dos carros modelo <strong>"Palio"</strong>?'},
              
              {'name': 'SELECT colunas específicas',
               'short_name': 'select_columns',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Placa', 'Cor', 'Modelo'],
                          'values': [['LLL0000', 'Prata', 'Palio'],
                                     ['LXZ3333', 'Preto', 'Palio']]},
               'prompt': '<br/>Apresente as placas, cores e modelos dos carros modelo <strong>"Palio"</strong>.'},
             
              {'name': 'SELECT *',
               'short_name': 'select_all',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Placa', 'Modelo', 'Ano', 'Cor'],
                          'values': [['LLL0000', 'Palio', 2015, 'Prata'],
                                     ['LKY1111', 'Punto', 2019, 'Cinza'],
                                     ['LMN2222', 'Meriva', 2017, 'Branco'],
                                     ['LXZ3333', 'Palio', 2017, 'Preto']]},
               'prompt': '<br/>Apresente todos os campos da tabela <strong>carro</strong>.'},

              {'name': 'SELECT TELEFONE',
               'short_name': 'telefone',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Telefone'],
                          'values': [[26215850]]},
               'prompt': '<br/>Qual é o telefone da cliente chamada <strong>"Joana"</strong>?'},

              {'name': 'INNER JOIN',
               'short_name': 'innerjoin',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Placa', 'Modelo', 'Ano', 'Cor', 'IDCliente', 'Placa', 'Data', 'Valor'],
                          'values': [['LLL0000', 'Palio', 2015, 'Prata', 1, 'LLL0000', '2021-10-02', 35000],
                                     ['LKY1111', 'Punto', 2019, 'Cinza', 2, 'LKY1111', '2021-10-01', 45000],
                                     ['LMN2222', 'Meriva', 2017, 'Branco', 2, 'LMN2222', '2021-10-02', 50000],
                                     ['LXZ3333', 'Palio', 2017, 'Preto', 4, 'LXZ3333', '2021-10-01', 43000]]},
               'prompt': '<br/>Junte as tabelas <strong>carro</strong> e <strong>venda</strong>. <br/><br/> Dica: Utilize o comando <code>INNER JOIN</code> començando pela tabela <strong>carro</strong>.'},

              {'name': 'INNER JOIN Palio Prata',
               'short_name': 'palioprata',
               'database_type': 'vendacarros',
               'answer': {'columns': ['IDCliente'],
                          'values': [[1]]},
               'prompt': '</br>Qual é o ID dos clientes que compraram carros de modelo <strong>"Palio"</strong> e cor <strong>"Prata"</strong>?'},

              {'name': 'INNER JOIN Telefone',
               'short_name': 'innerjointelefone',
               'database_type': 'vendacarros',
               'answer': {'columns': ['IDCliente', 'Telefone'],
                          'values': [[1, 26260000]]},
               'prompt': '</br>Qual é o ID e o telefone dos clientes que compraram carros de modelo <strong>"Palio"</strong> e cor <strong>"Prata"</strong>?'},

              {'name': 'DISTINCT',
               'short_name': 'distinct',
               'database_type': 'locadora',
               'answer': {'columns': ['Nome'],
                          'values': [['Monteiro Lobato'],
                                     ['Dias Gomes']]},
               'prompt': '</br>Qual é o nome dos clientes que locaram filmes do <strong>"James Cameron"</strong>?</br></br>DICA: Use o código <code>DISTINCT</code>.'},

              {'name': 'DATA Atraso',
               'short_name': 'dataatraso',
               'database_type': 'locadora',
               'answer': {'columns': ['Nome'],
                          'values': [['Dias Gomes']]},
               'prompt': '</br>Quais clientes estão com locações em atraso?</br></br>Dica: Nesse site, as funções de data como MONTH() e DAY() não funcionam. Para fazer transações com data devem ser utilizados os comandos <code>></code>, <code><</code>, <code>=</code>, <code>>=</code>, <code><=</code>, <code><></code>.'},

              {'name': 'OR, AND, NOT',
               'short_name': 'not',
               'database_type': 'locadora',
               'answer': {'columns': ['Título'],
                          'values': [['Roma']]},
               'prompt': '</br>Quais são os títulos dos filmes que foram produzidos no <strong>México</strong> ou no <strong>Brasil</strong> depois do ano de <strong>2010</strong>, que não são do gênero <strong>comédia</strong>?'},

              {'name': 'DATA 10/2020',
               'short_name': 'data7dias',
               'database_type': 'locadora',
               'answer': {'columns': ['IDCliente'],
                          'values': [[3],
                                     [5],
                                     [2],
                                     [4]]},
               'prompt': '</br>Quais os IDs dos clientes que já devolveram filmes com <strong>7 dias ou mais de atraso</strong>?'},

              {'name': 'LIKE',
               'short_name': 'like',
               'database_type': 'locadora',
               'answer': {'columns': ['Título'],
                          'values': [['O Amor Não Tira Férias']]},
               'prompt': '</br>Qual é o nome dos filmes que possuem a palavra <strong>"amor"</strong> em seu título?</br></br>Dica: Utilize <code>%</code> para indicar o ou mais caracteres e <code>_</code> para indicar 1 caracter.'},

              {'name': 'SUM',
               'short_name': 'sum',
               'database_type': 'locadora',
               'answer': {'columns': ['SUM(Valor)'],
                          'values': [[67]]},
               'prompt': '</br>Qual é a receita total das locações realizadas no ano de <strong>2020</strong>?'},

              {'name': 'COUNT, AVG, MAX, MIN',
               'short_name': 'countavgmaxmin',
               'database_type': 'locadora',
               'answer': {'columns': ['COUNT(Valor)', 'AVG(Valor)', 'MAX(Valor)', 'MIN(Valor)'],
                          'values': [[9, 7.444444444444445, 15, 6]]},
               'prompt': '</br>Qual é a <strong>quantidade</strong> de locações devolvidas no ano de <strong>2020</strong>, a sua <strong>média</strong> de valor, o valor da <strong>maior</strong> locação feita e da <strong>menor</strong> locação?'},

              {'name': 'COUNT *',
               'short_name': 'count',
               'database_type': 'locadora',
               'answer': {'columns': ['COUNT(*)'],
                          'values': [[3]]},
               'prompt': '</br>Quantas locações de filmes de <strong>"Drama"</strong> foram realizadas em <strong>2020</strong>?'},

              {'name': 'AS',
               'short_name': 'as',
               'database_type': 'vendacarros',
               'answer': {'columns': ['ReceitaPalio'],
                          'values': [[78000]]},
               'prompt': '</br>Qual foi a receita das vendas em <strong>2021</strong>?<br></br>Dica: utilize o comando <code>AS</code> para mudar o nome da variável para <strong>"ReceitaPalio"</strong>'},

              {'name': 'GROUP BY',
               'short_name': 'groupby',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Receita', 'Modelo'],
                          'values': [[50000, 'Meriva'],
                                     [78000, 'Palio'],
                                     [45000, 'Punto']]},
               'prompt': '</br>Qual é a receita das vendas de cada modelo em <strong>2021</strong>?<br></br>Dica: utilize o comando <code>AS</code> para mudar o nome da variável para <strong>"Receita"</strong>'},

              {'name': 'HAVING',
               'short_name': 'having',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Média', 'Modelo'],
                          'values': [[50000, 'Meriva'],
                                     [45000, 'Punto']]},
               'prompt': '</br> Qual foi o valor médio das venda de cada modelo em <strong>2021</strong>? Considere apenas as médias superiores a 40000.'},

              {'name': 'ORDER BY',
               'short_name': 'orderby',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Média', 'Modelo', 'Ano'],
                          'values': [[45000, 'Punto', 2019],
                                     [50000, 'Meriva', 2017]]},
               'prompt': '</br> Qual foi o valor médio das vendas de cada modelo para cada ano de fabricação em <strong>2021</strong>? Considere apenas as médias superiores a <strong>40000</strong>, e apresente os resultados em ordem <strong>decrescente</strong> do ano de fabricação.'},

              {'name': 'SELECT Contas',
               'short_name': 'selectcontas',
               'database_type': 'vendedores',
               'answer': {'columns': ['IDVendedor', 'Total'],
                          'values': [[1, 4000],
                                     [2, 6510]]},
               'prompt': '</br> Qual foi o valor total de comissão recebida com cada vendedor em <strong>2021</strong>?'},

              ];


// Create the SQL database
var load_database = function(db_type) {
  var database, sqlstr, table_names;
  database = new sql.Database();
  switch (db_type) {
      case 'vendacarros':
      sqlstr = "CREATE TABLE carro (Placa, Modelo, Ano, Cor);";
      sqlstr += "INSERT INTO carro VALUES ('LLL0000', 'Palio', 2015, 'Prata');";
      sqlstr += "INSERT INTO carro VALUES ('LKY1111', 'Punto', 2019, 'Cinza');";
      sqlstr += "INSERT INTO carro VALUES ('LMN2222', 'Meriva', 2017, 'Branco');";
      sqlstr += "INSERT INTO carro VALUES ('LXZ3333', 'Palio', 2017, 'Preto');";
      sqlstr += "CREATE TABLE cliente (IDCliente, Nome, Telefone);";
      sqlstr += "INSERT INTO cliente VALUES (1, 'Roberta', 26260000);";
      sqlstr += "INSERT INTO cliente VALUES (2, 'André', 26101111);";
      sqlstr += "INSERT INTO cliente VALUES (3, 'Joana', 26215850);";
      sqlstr += "INSERT INTO cliente VALUES (4, 'Paulo', 26119620);";
      sqlstr += "CREATE TABLE venda (IDCliente, Placa, Data, Valor);";
      sqlstr += "INSERT INTO venda VALUES (2, 'LKY1111', '2021-10-01', 45000);";
      sqlstr += "INSERT INTO venda VALUES (4, 'LXZ3333', '2021-10-01', 43000);";
      sqlstr += "INSERT INTO venda VALUES (1, 'LLL0000', '2021-10-02', 35000);";
      sqlstr += "INSERT INTO venda VALUES (2, 'LMN2222', '2021-10-02', 50000);";
      table_names = ['carro', 'cliente', 'venda'];
      break;
    case 'locadora':
      sqlstr = "CREATE TABLE cliente (IDCliente, Nome, Telefone);";
      sqlstr += "INSERT INTO cliente VALUES (1, 'Bruno Torres', 22222222);";
      sqlstr += "INSERT INTO cliente VALUES (2, 'Monteiro Lobato', 33332222);";
      sqlstr += "INSERT INTO cliente VALUES (3, 'Dias Gomes', 22223333);";
      sqlstr += "INSERT INTO cliente VALUES (4, 'Machado de Assis', 22222220);";
      sqlstr += "INSERT INTO cliente VALUES (5, 'Dias Gomes', 22222221);";
      sqlstr += "CREATE TABLE DVD (IDDVD, DataAquisição, Estado, IDFilme);";
      sqlstr += "INSERT INTO DVD VALUES (1, '2019-01-01', 'Ruim', 1);";
      sqlstr += "INSERT INTO DVD VALUES (2, '2019-02-01', 'Bom', 3);";
      sqlstr += "INSERT INTO DVD VALUES (3, '2019-04-03', 'Muito Bom', 3);";
      sqlstr += "INSERT INTO DVD VALUES (4, '2020-06-06', 'Excelente', 2);";
      sqlstr += "INSERT INTO DVD VALUES (5, '2020-01-01', 'Excelente', 5);";
      sqlstr += "INSERT INTO DVD VALUES (6, '2020-06-20', 'Muito Bom', 6);";
      sqlstr += "INSERT INTO DVD VALUES (7, '2020-08-28', 'Excelente', 4);";
      sqlstr += "INSERT INTO DVD VALUES (8, '2019-04-03', 'Bom', 3);";
      sqlstr += "INSERT INTO DVD VALUES (9, '2020-05-30', 'Bom', 4);";
      sqlstr += "INSERT INTO DVD VALUES (10, '2020-06-20', 'Excelente', 7);";
      sqlstr += "INSERT INTO DVD VALUES (11, '2020-06-20', 'Excelente', 8);";
      sqlstr += "CREATE TABLE locação (IDDVD, IDCliente, DataLoc, DataVenc, DataDev, Valor);";
      sqlstr += "INSERT INTO locação VALUES (1, 1, '2020-09-20', '2020-09-23', '2020-09-22', 6);";
      sqlstr += "INSERT INTO locação VALUES (2, 2, '2020-09-21', '2020-09-24', '2020-09-25', 8);";
      sqlstr += "INSERT INTO locação VALUES (4, 2, '2020-09-21', '2020-09-24', '2020-09-25', 8);";
      sqlstr += "INSERT INTO locação VALUES (3, 2, '2020-09-23', '2020-09-26', '2020-09-24', 6);";
      sqlstr += "INSERT INTO locação VALUES (10, 3, '2020-10-01', '2020-10-04', '2020-10-04', 6);";
      sqlstr += "INSERT INTO locação VALUES (7, 5, '2020-10-01', '2020-10-03', '2020-10-03', 6);";
      sqlstr += "INSERT INTO locação VALUES (11, 2, '2020-10-03', '2020-10-07', '2020-10-04', 6);";
      sqlstr += "INSERT INTO locação VALUES (8, 3, '2020-10-04', '2020-11-18', null, null);";
      sqlstr += "INSERT INTO locação VALUES (9, 4, '2020-10-07', '2020-10-10', '2020-10-09', 6);";
      sqlstr += "INSERT INTO locação VALUES (4, 4, '2020-10-10', '2020-10-13', '2020-10-21', 15);";
      sqlstr += "INSERT INTO locação VALUES (6, 2, '2021-03-08', '2021-03-09', '2021-03-09', 8);";
      sqlstr += "CREATE TABLE filme (IDFilme, Título, Gênero, Diretor, País, Ano);";
      sqlstr += "INSERT INTO filme VALUES (1, 'Toy Story', 'Animação', 'John Lasseter', 'EUA', 1995);";
      sqlstr += "INSERT INTO filme VALUES (2, 'Roma', 'Drama', 'Alfonso Cuarón', 'México', 2018);";
      sqlstr += "INSERT INTO filme VALUES (3, 'Titanic', 'Romance', 'James Cameron', 'EUA', 1998);";
      sqlstr += "INSERT INTO filme VALUES (4, 'A Noviça Rebelde', 'Musical', 'Robert Wise', 'EUA', 1965);";
      sqlstr += "INSERT INTO filme VALUES (5, 'O Amor Não Tira Férias', 'Romance', 'Nancy Meyers', 'EUA', 2006);";
      sqlstr += "INSERT INTO filme VALUES (6, 'Velozes e Furiosos', 'Ação', 'Rob Cohen', 'EUA', 2001);";
      sqlstr += "INSERT INTO filme VALUES (7, 'O Resgate do Soldado Ryan', 'Ação', 'Steven Spielberg', 'EUA', 1998);";
      sqlstr += "INSERT INTO filme VALUES (8, 'Cidade de Deus', 'Drama', 'Fernando Meirelles', 'Brasil', 2002);";
      table_names = ['cliente', 'DVD', 'locação', 'filme'];
      break;
      case 'vendedores':
      sqlstr = "CREATE TABLE carro (Placa, Modelo, Ano, Cor);";
      sqlstr += "INSERT INTO carro VALUES ('LLL0000', 'Palio', 2015, 'Prata');";
      sqlstr += "INSERT INTO carro VALUES ('LKY1111', 'Punto', 2019, 'Cinza');";
      sqlstr += "INSERT INTO carro VALUES ('LMN2222', 'Meriva', 2017, 'Branco');";
      sqlstr += "INSERT INTO carro VALUES ('LXZ3333', 'Palio', 2017, 'Preto');";
      sqlstr += "CREATE TABLE cliente (IDCliente, Nome, Telefone);";
      sqlstr += "INSERT INTO cliente VALUES (1, 'Roberta', 26260000);";
      sqlstr += "INSERT INTO cliente VALUES (2, 'André', 26101111);";
      sqlstr += "INSERT INTO cliente VALUES (3, 'Joana', 26215850);";
      sqlstr += "INSERT INTO cliente VALUES (4, 'Paulo', 26119620);";
      sqlstr += "CREATE TABLE venda (IDCliente, Placa, Data, Valor, IDVendedor, Turno);";
      sqlstr += "INSERT INTO venda VALUES (2, 'LKY1111', '2021-10-01', 45000, 1, 'Manhã');";
      sqlstr += "INSERT INTO venda VALUES (4, 'LXZ3333', '2021-10-01', 43000, 2, 'Tarde');";
      sqlstr += "INSERT INTO venda VALUES (1, 'LLL0000', '2021-10-02', 35000, 1, 'Manhã');";
      sqlstr += "INSERT INTO venda VALUES (2, 'LMN2222', '2021-10-02', 50000, 2, 'Manhã');";
      sqlstr += "CREATE TABLE vendedor (IDVendedor, Nome Vendedor, Telefone Vendedor, Comissão);";
      sqlstr += "INSERT INTO vendedor VALUES (1, 'João das Couves', 26262626, 5);";
      sqlstr += "INSERT INTO vendedor VALUES (2, 'Maria das Brócolis', 27272727, 7);";
      table_names = ['carro', 'cliente', 'venda', 'vendedor'];
      break;
  }

  database.run(sqlstr);

  var current_table_string = '';
  for (var index in table_names) {
    results = database.exec("SELECT * FROM " + table_names[index] + ";");
    current_table_string += '<div class="table-name">' + table_names[index] + '</div>' + table_from_results(results);
  }
  $('#current-tables').html(current_table_string);

  return database;
};

var current_level;
var current_level_name;

var render_menu = function() {
  // Add links to menu
  var menu_html = '';
  for (var index in levels) {
    if (index == (current_level - 1)) {
      menu_html += '<strong>';
    }
    menu_html += '<div class="menu-item">';
    if (localStorage.getItem('completed-' + levels[index]['short_name'])) {
      menu_html += '<span class="glyphicon glyphicon-ok"></span>';
    }
    menu_html += '<a href="#!' + levels[index]['short_name'] + '">' + levels[index]['name'] + '</a>';
    menu_html += '</div>';
    if (index == (current_level - 1)) {
      menu_html += '</strong>';
    }
  }
  $('.menu').html(menu_html);
}

var load_level = function() {
  var hash_code = window.location.hash.substr(2);

  if (hash_code == 'menu') {
    render_menu();
    $('.menu').removeClass('menu-hidden-for-mobile');
    $('.not-menu-container').hide();
    return;
  }
  $('.menu').addClass('menu-hidden-for-mobile');
  $('.not-menu-container').show();

  // The current level is 1 by default, unless the hash code matches the short name for a level.
  current_level = 1;
  for (var index in levels) {
    if (hash_code == levels[index]['short_name']) {
      current_level = parseInt(index, 10) + 1;
      break;
    }
  }
  var database = load_database(levels[current_level-1]['database_type']);
  // Set text for current level
  lesson_name = levels[current_level-1]['name'];
  $('#lesson-name').text("Lição " + current_level + ": " + lesson_name);
  $('#prompt').html(levels[current_level-1]['prompt']);

  // Add "next" and "previous" links if it makes sense.
  if (current_level > 1) {
    $('#previous-link').attr('href', '#!' + levels[current_level-2]['short_name']);
    $('#previous-link').show();
  } else {
    $('#previous-link').hide();
  }
  if (current_level < levels.length) {
    $('#next-link').attr('href', '#!' + levels[current_level]['short_name']);
    $('#next-link').show();
  } else {
    $('#next-link').hide();
  }

  // Add links to menu
  render_menu();

  // Clear out old data
  $('#answer-correct').hide();
  $('#answer-wrong').hide();
  $('#sql-input').val('');
  $('#results').html('');
  $('.expected-results-container').hide();
  return database;
};
db = load_level();

// When the URL after the # changes, we load a new level.
$(window).bind('hashchange', function() {
  db = load_level();
});
