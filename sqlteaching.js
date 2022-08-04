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
               'prompt': 'In SQL, data is usually organized in various tables. For example, a sports team database might have the tables <em>teams</em>, <em>players</em>, and <em>games</em>. A wedding database might have tables <em>guests</em>, <em>vendors</em>, and <em>music_playlist</em>.<br/><br/>Imagine we have a table that stores family members with each member\'s name, species, gender, and number of books read.<br/><br/>Let\'s start by grabbing all of the data in one table.  We have a table called <strong>family_members</strong> that is shown below.  In order to grab all of that data, please run the following command: <code>SELECT * FROM family_members;</code><br/><br/>The <code>*</code> above means that all of the columns will be returned, which in this case are <em>id</em>, <em>name</em>, <em>gender</em>, <em>species</em>, and <em>num_books_read</em>. <br/><br/>Note: This tutorial uses the <a href="http://en.wikipedia.org/wiki/SQLite" target="_blank">SQLite</a> database engine.  The different variants of SQL use slightly different syntax.'},

              {'name': 'SELECT colunas específicas',
               'short_name': 'select_columns',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Placa', 'Cor', 'Modelo'],
                          'values': [['LLL0000', 'Prata', 'Palio'],
                                     ['LXZ3333', 'Preto', 'Palio']]},
               'prompt': '<code>SELECT *</code> grabs all fields (called columns) in a table. If we only wanted to see the name and num_books_read columns, we would type<br/> <code>SELECT name, num_books_read FROM family_members;</code>.<br/><br/>Can you return just the name and species columns?'},
             
              {'name': 'SELECT *',
               'short_name': 'select_all',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Placa', 'Modelo', 'Ano', 'Cor'],
                          'values': [['LLL0000', 'Palio', 2015, 'Prata'],
                                     ['LKY1111', 'Punto', 2019, 'Cinza'],
                                     ['LMN2222', 'Meriva', 2017, 'Branco'],
                                     ['LXZ3333', 'Palio', 2017, 'Preto']]},
               'prompt': 'SQL accepts various inequality symbols, including: <br/><code>=</code> "equal to"<br/><code>></code> "greater than"<br/><code><</code> "less than"<br/><code>>=</code> "greater than or equal to"<br/><code><=</code> "less than or equal to"<br/><br/> Can you return all rows in <strong>family_members</strong> where num_books_read is a value greater or equal to 180?'},

              {'name': 'SELECT TELEFONE',
               'short_name': 'telefone',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Telefone'],
                          'values': [[26215850]]},
               'prompt': 'In the <code>WHERE</code> part of a query, you can search for multiple attributes by using the <code>AND</code> keyword.  For example, if you wanted to find the friends of Pickles that are over 25cm in height and are cats, you would run: <br/><code>SELECT * FROM friends_of_pickles WHERE height_cm > 25 AND species = \'cat\';</code><br/><br/>Can you find all of Pickles\' friends that are dogs and under the height of 45cm?'},

              {'name': 'INNER JOIN',
               'short_name': 'innerjoin',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Placa', 'Modelo', 'Ano', 'Cor', 'IDCliente', 'Placa', 'Data', 'Valor'],
                          'values': [['LLL0000', 'Palio', 2015, 'Prata', 1, 'LLL0000', '2021-10-02', 35000],
                                     ['LKY1111', 'Punto', 2019, 'Cinza', 2, 'LKY1111', '2021-10-01', 45000],
                                     ['LMN2222', 'Meriva', 2017, 'Branco', 2, 'LMN2222', '2021-10-02', 50000],
                                     ['LXZ3333', 'Palio', 2017, 'Preto', 4, 'LXZ3333', '2021-10-01', 43000]]},
               'prompt': 'In the <code>WHERE</code> part of a query, you can search for rows that match any of multiple attributes by using the <code>OR</code> keyword.  For example, if you wanted to find the friends of Pickles that are over 25cm in height or are cats, you would run: <br/><code>SELECT * FROM friends_of_pickles WHERE height_cm > 25 OR species = \'cat\';</code><br/><br/>Can you find all of Pickles\' friends that are dogs or under the height of 45cm?'},

              {'name': 'INNER JOIN Palio Prata',
               'short_name': 'palioprata',
               'database_type': 'vendacarros',
               'answer': {'columns': ['IDCliente'],
                          'values': [[1]]},
               'prompt': 'Using the <code>WHERE</code> clause, we can find rows where a value is in a list of several possible values. <br/><br/><code>SELECT * FROM friends_of_pickles WHERE species IN (\'cat\', \'human\');</code> would return the <strong>friends_of_pickles</strong> that are either a cat or a human. <br/><br/>To find rows that are not in a list, you use <code>NOT IN</code> instead of <code>IN</code>. <br/><br/>Can you run a query that would return the rows that are <strong>not</strong> cats or dogs?'},

              {'name': 'INNER JOIN Telefone',
               'short_name': 'innerjointelefone',
               'database_type': 'vendacarros',
               'answer': {'columns': ['IDCliente', 'Telefone'],
                          'values': [[1, 26260000]]},
               'prompt': 'By putting <code>DISTINCT</code> after <code>SELECT</code>, you do not return duplicates. <br/><br/>For example, if you run <br/> <code>SELECT DISTINCT gender, species FROM friends_of_pickles WHERE height_cm < 100;</code>, you will get the gender/species combinations of the animals less than 100cm in height. <br/><br/>Note that even though there are multiple male dogs under that height, we only see one row that returns "male" and "dog".<br/><br/> Can you return a list of the distinct species of animals greater than 50cm in height?'},

              {'name': 'DISTINCT',
               'short_name': 'distinct',
               'database_type': 'locadora',
               'answer': {'columns': ['Nome'],
                          'values': [['Monteiro Lobato'],
                                     ['Dias Gomes']]},
               'prompt': 'If you want to sort the rows by some kind of attribute, you can use the <code>ORDER BY</code> keyword.  For example, if you want to sort the <strong>friends_of_pickles</strong> by name, you would run: <code>SELECT * FROM friends_of_pickles ORDER BY name;</code>.  That returns the names in ascending alphabetical order.<br/><br/> In order to put the names in descending order, you would add a <code>DESC</code> at the end of the query.<br/><br/> Can you run a query that sorts the <strong>friends_of_pickles</strong> by <em>height_cm</em> in descending order?'},

              {'name': 'DATA Atraso',
               'short_name': 'dataatraso',
               'database_type': 'locadora',
               'answer': {'columns': ['Nome'],
                          'values': [['Dias Gomes']]},
               'prompt': 'Often, tables contain millions of rows, and it can take a while to grab everything. If we just want to see a few examples of the data in a table, we can select the first few rows with the <code>LIMIT</code> keyword. If you use <code>ORDER BY</code>, you would get the first rows for that order. <br/><br/>If you wanted to see the two shortest <strong>friends_of_pickles</strong>, you would run: <code>SELECT * FROM friends_of_pickles ORDER BY height_cm LIMIT 2;</code><br/><br/> Can you return the single row (and all columns) of the tallest <strong>friends_of_pickles</strong>?<br/><br/>Note: <br/>- Some variants of SQL do not use the <code>LIMIT</code> keyword.<br/>- The <code>LIMIT</code> keyword comes after the <code>DESC</code> keyword.'},

              {'name': 'NOT',
               'short_name': 'not',
               'database_type': 'locadora',
               'answer': {'columns': ['Título'],
                          'values': [['Roma']]},
               'prompt': 'Another way to explore a table is to check the number of rows in it. For example, if we are querying a table <em>states_of_us</em>, we\'d expect 50 rows, or 500 rows in a table called <em>fortune_500_companies</em>.<br/><br/><code>SELECT COUNT(*) FROM friends_of_pickles;</code> returns the total number of rows in the table <strong>friends_of_pickles</strong>. Try this for yourself.'},

              {'name': 'DATA 10/2020',
               'short_name': 'data7dias',
               'database_type': 'locadora',
               'answer': {'columns': ['IDCliente'],
                          'values': [[3],
                                     [5],
                                     [2],
                                     [4]]},
               'prompt': 'We can combine <code>COUNT(*)</code> with <code>WHERE</code> to return the number of rows that matches the <code>WHERE</code> clause.<br/><br/> For example, <code>SELECT COUNT(*) FROM friends_of_pickles WHERE species = \'human\';</code> returns 2.<br/><br/>Can you return the number of rows in <strong>friends_of_pickles</strong> where the species is a dog?'},

              {'name': 'LIKE',
               'short_name': 'like',
               'database_type': 'locadora',
               'answer': {'columns': ['Título'],
                          'values': [['O Amor Não Tira Férias']]},
               'prompt': 'We can use the <code>SUM</code> keyword in order to find the sum of a given value. <br/><br/>For example, running <code>SELECT SUM(num_legs) FROM family_members;</code> returns the total number of legs in the family. <br/><br/>Can you find the total num_books_read made by this family?'},

              {'name': 'SUM',
               'short_name': 'sum',
               'database_type': 'locadora',
               'answer': {'columns': ['SUM(Valor)'],
                          'values': [[67]]},
               'prompt': 'We can use the <code>AVG</code> keyword in order to find the average of a given value. <br/><br/>For example, running <code>SELECT AVG(num_legs) FROM family_members;</code> returns the average number of legs of each family member. <br/><br/>Can you find the average num_books_read made by each family member? <br/><br/>Note: <br/>- Because of the way computers handle numbers, averages will not always be completely exact.'},

              {'name': 'COUNT, AVG, MAX, MIN',
               'short_name': 'countavgmaxmin',
               'database_type': 'locadora',
               'answer': {'columns': ['COUNT(Valor)', 'AVG(Valor)', 'MAX(Valor)', 'MIN(Valor)'],
                          'values': [[9, 7.444444444444445, 15, 6]]},
               'prompt': 'We can use the <code>MAX</code> and <code>MIN</code> to find the maximum or minimum value of a table. <br/><br/>To find the least number of legs in a family member (<em>2</em>), you can run <br/><code>SELECT MIN(num_legs) FROM family_members;</code> <br/><br/>Can you find the highest num_books_read that a family member makes?'},

              {'name': 'COUNT *',
               'short_name': 'count',
               'database_type': 'locadora',
               'answer': {'columns': ['COUNT(*)'],
                          'values': [[3]]},
               'prompt': 'You can use aggregate functions such as <code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MAX</code>, and <code>MIN</code> with the <code>GROUP BY</code> clause. <br/><br/> When you <code>GROUP BY</code> something, you split the table into different piles based on the value of each row. <br/><br/>For example, <br/><code>SELECT COUNT(*), species FROM friends_of_pickles GROUP BY species;</code> would return the number of rows for each species. <br/><br/> Can you return the tallest height for each species? Remember to return the species name next to the height too, like in the example query.'},

              {'name': 'AS',
               'short_name': 'as',
               'database_type': 'vendacarros',
               'answer': {'columns': ['ReceitaPalio'],
                          'values': [[78000]]},
               'prompt': 'In SQL, you can put a SQL query inside another SQL query. <br/><br/>For example, to find the family members with the least number of legs, <br/> you can run: <br/><code>SELECT * FROM family_members WHERE num_legs = (SELECT MIN(num_legs) FROM family_members);</code> <br/><br/> The <code>SELECT</code> query inside the parentheses is executed first, and returns the minimum number of legs.  Then, that value (2) is used in the outside query, to find all family members that have 2 legs. <br/><br/> Can you return the family members that have the highest num_books_read?'},

              {'name': 'GROUP BY',
               'short_name': 'groupby',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Receita', 'Modelo'],
                          'values': [[50000, 'Meriva'],
                                     [78000, 'Palio'],
                                     [45000, 'Punto']]},
               'prompt': 'Sometimes, in a given row, there is no value at all for a given column.  For example, a dog does not have a favorite book, so in that case there is no point in putting a value in the <em>favorite_book</em> column, and the value is <code>NULL</code>.  In order to find the rows where the value for a column is or is not <code>NULL</code>, you would use <code>IS NULL</code> or <code>IS NOT NULL</code>.<br/><br/>Can you return all of the rows of <strong>family_members</strong> where <em>favorite_book</em> is not null?'},

              {'name': 'HAVING',
               'short_name': 'having',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Média', 'Modelo'],
                          'values': [[50000, 'Meriva'],
                                     [45000, 'Punto']]},
               'prompt': 'Sometimes, a column can contain a date value.  The first 4 digits represents the year, the next 2 digits represents the month, and the next 2 digits represents the day of the month.  For example, <code>1985-07-20</code> would mean July 20, 1985.<br/><br/>You can compare dates by using <code><</code> and <code>></code>.  For example, <code>SELECT * FROM celebs_born WHERE birthdate < \'1985-08-17\';</code> returns a list of celebrities that were born before August 17th, 1985.<br/><br/>Can you return a list of celebrities that were born after September 1st, 1980?'},

              {'name': 'ORDER BY',
               'short_name': 'orderby',
               'database_type': 'vendacarros',
               'answer': {'columns': ['Média', 'Modelo', 'Ano'],
                          'values': [[45000, 'Punto', 2019],
                                     [50000, 'Meriva', 2017]]},
               'prompt': 'Different parts of information can be stored in different tables, and in order to put them together, we use <code>INNER JOIN ... ON</code>. Joining tables gets to the core of SQL functionality, but it can get very complicated. We will start with a simple example, and will start with an <code>INNER JOIN</code>.<br/><br/>As you can see below, there are 3 tables:<br/><strong>character</strong>: Each character is a row and is represented by a unique identifier (<em>id</em>), e.g. 1 is Doogie Howser<br/><strong>character_tv_show:</strong> For each character, which show is he/she in?<br/><strong>character_actor</strong>: For each character, who is the actor?<br/><br/>See that in <strong>character_tv_show</strong>, instead of storing both the character and TV show names (e.g. Willow Rosenberg and Buffy the Vampire Slayer), it stores the <em>character_id</em> as a substitute for the character name. This <em>character_id</em> refers to the matching <em>id</em> row from the <strong>character</strong> table. <br/><br/>This is done so data is not duplicated.  For example, if the name of a character were to change, you would only have to change the name of the character in one row. <br/><br/>This allows us to "join" the tables together "on" that reference/common column. <br/><br/>To get each character name with his/her TV show name, we can write <br/><code>SELECT character.name, character_tv_show.tv_show_name<br/> FROM character <br/>INNER JOIN character_tv_show<br/> ON character.id = character_tv_show.character_id;</code><br/>This puts together every row in <strong>character</strong> with the corresponding row in <strong>character_tv_show</strong>, or vice versa.<br/><br/>Note:<br/>- We use the syntax <strong>table_name</strong>.<em>column_name</em>. If we only used <em>column_name</em>, SQL might incorrectly assume which table it is coming from.<br/> - The example query above is written over multiple lines for readability, but that does not affect the query. <br/><br/>Can you use an inner join to pair each character name with the actor who plays them?  Select the columns: <strong>character</strong>.<em>name</em>, <strong>character_actor</strong>.<em>actor_name</em>'},

              {'name': 'SELECT Contas',
               'short_name': 'selectcontas',
               'database_type': 'vendedores',
               'answer': {'columns': ['IDVendedor', 'Total'],
                          'values': [[1, 4000],
                                     [2, 6510]]},
               'prompt': 'In the previous exercise, we explained that TV show character names were not duplicated, so if the name of a character were to change, you would only have to change the name of the character in one row. <br/><br/>However, the previous example was a bit artificial because the TV show names and actor names were duplicated. <br/><br/>In order to not duplicate any names, we need to have more tables, and use multiple joins. <br/><br/>We have tables for characters, TV shows, and actors.  Those tables represent things (also known as entities). <br/><br/>In addition those tables, we have the relationship tables <strong>character_tv_show</strong> and <strong>character_actor</strong>, which capture the relationship between two entities. <br/><br/>This is a flexible way of capturing the relationship between different entities, as some TV show characters might be in multiple shows, and some actors are known for playing multiple characters. <br/><br/>To get each character name with his/her TV show name, we can write <br/><code>SELECT character.name, tv_show.name<br/> FROM character <br/>INNER JOIN character_tv_show<br/> ON character.id = character_tv_show.character_id<br/>INNER JOIN tv_show<br/> ON character_tv_show.tv_show_id = tv_show.id;</code><br/><br/>Can you use two joins to pair each character name with the actor who plays them?  Select the columns: <strong>character</strong>.<em>name</em>, <strong>actor</strong>.<em>name</em>'},

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
      sqlstr += "INSERT INTO locação VALUES (8, 3, '2020-10-04', '2020-11-18', '', '');";
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
