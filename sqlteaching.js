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
    $('#answer-wrong').text('That was incorrect.  Please try again.');
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
                          'values': [[9, 6.7, 15, 6]]},
               'prompt': 'We can use the <code>MAX</code> and <code>MIN</code> to find the maximum or minimum value of a table. <br/><br/>To find the least number of legs in a family member (<em>2</em>), you can run <br/><code>SELECT MIN(num_legs) FROM family_members;</code> <br/><br/>Can you find the highest num_books_read that a family member makes?'},

              {'name': 'COUNT *',
               'short_name': 'count',
               'database_type': 'locadora',
               'answer': {'columns': ['COUNT(*)'],
                          'values': [[3]]},
               'prompt': 'You can use aggregate functions such as <code>COUNT</code>, <code>SUM</code>, <code>AVG</code>, <code>MAX</code>, and <code>MIN</code> with the <code>GROUP BY</code> clause. <br/><br/> When you <code>GROUP BY</code> something, you split the table into different piles based on the value of each row. <br/><br/>For example, <br/><code>SELECT COUNT(*), species FROM friends_of_pickles GROUP BY species;</code> would return the number of rows for each species. <br/><br/> Can you return the tallest height for each species? Remember to return the species name next to the height too, like in the example query.'},

              {'name': 'AS',
               'short_name': 'as',
               'database_type': 'locadora',
               'answer': {'columns': ['Receita Palio'],
                          'values': [[78000]]},
               'prompt': 'In SQL, you can put a SQL query inside another SQL query. <br/><br/>For example, to find the family members with the least number of legs, <br/> you can run: <br/><code>SELECT * FROM family_members WHERE num_legs = (SELECT MIN(num_legs) FROM family_members);</code> <br/><br/> The <code>SELECT</code> query inside the parentheses is executed first, and returns the minimum number of legs.  Then, that value (2) is used in the outside query, to find all family members that have 2 legs. <br/><br/> Can you return the family members that have the highest num_books_read?'},

              {'name': 'GROUP BY',
               'short_name': 'groupby',
               'database_type': 'locadora',
               'answer': {'columns': ['Receita', 'Modelo'],
                          'values': [[78000, 'Palio'],
                                     [45000, 'Punto'],
                                     [50000, 'Meriva']]},
               'prompt': 'Sometimes, in a given row, there is no value at all for a given column.  For example, a dog does not have a favorite book, so in that case there is no point in putting a value in the <em>favorite_book</em> column, and the value is <code>NULL</code>.  In order to find the rows where the value for a column is or is not <code>NULL</code>, you would use <code>IS NULL</code> or <code>IS NOT NULL</code>.<br/><br/>Can you return all of the rows of <strong>family_members</strong> where <em>favorite_book</em> is not null?'},

              {'name': 'HAVING',
               'short_name': 'having',
               'database_type': 'locadora',
               'answer': {'columns': ['id', 'name', 'birthdate'],
                          'values': [[2, 'Justin Timberlake', '1981-01-31'],
                                     [3, 'Taylor Swift', '1989-12-13']]},
               'prompt': 'Sometimes, a column can contain a date value.  The first 4 digits represents the year, the next 2 digits represents the month, and the next 2 digits represents the day of the month.  For example, <code>1985-07-20</code> would mean July 20, 1985.<br/><br/>You can compare dates by using <code><</code> and <code>></code>.  For example, <code>SELECT * FROM celebs_born WHERE birthdate < \'1985-08-17\';</code> returns a list of celebrities that were born before August 17th, 1985.<br/><br/>Can you return a list of celebrities that were born after September 1st, 1980?'},

              {'name': 'Inner joins',
               'short_name': 'joins',
               'database_type': 'tv',
               'answer': {'columns': ['name', 'actor_name'],
                          'values': [['Doogie Howser', 'Neil Patrick Harris'],
                                     ['Barney Stinson', 'Neil Patrick Harris'],
                                     ['Lily Aldrin', 'Alyson Hannigan'],
                                     ['Willow Rosenberg', 'Alyson Hannigan']]},
               'prompt': 'Different parts of information can be stored in different tables, and in order to put them together, we use <code>INNER JOIN ... ON</code>. Joining tables gets to the core of SQL functionality, but it can get very complicated. We will start with a simple example, and will start with an <code>INNER JOIN</code>.<br/><br/>As you can see below, there are 3 tables:<br/><strong>character</strong>: Each character is a row and is represented by a unique identifier (<em>id</em>), e.g. 1 is Doogie Howser<br/><strong>character_tv_show:</strong> For each character, which show is he/she in?<br/><strong>character_actor</strong>: For each character, who is the actor?<br/><br/>See that in <strong>character_tv_show</strong>, instead of storing both the character and TV show names (e.g. Willow Rosenberg and Buffy the Vampire Slayer), it stores the <em>character_id</em> as a substitute for the character name. This <em>character_id</em> refers to the matching <em>id</em> row from the <strong>character</strong> table. <br/><br/>This is done so data is not duplicated.  For example, if the name of a character were to change, you would only have to change the name of the character in one row. <br/><br/>This allows us to "join" the tables together "on" that reference/common column. <br/><br/>To get each character name with his/her TV show name, we can write <br/><code>SELECT character.name, character_tv_show.tv_show_name<br/> FROM character <br/>INNER JOIN character_tv_show<br/> ON character.id = character_tv_show.character_id;</code><br/>This puts together every row in <strong>character</strong> with the corresponding row in <strong>character_tv_show</strong>, or vice versa.<br/><br/>Note:<br/>- We use the syntax <strong>table_name</strong>.<em>column_name</em>. If we only used <em>column_name</em>, SQL might incorrectly assume which table it is coming from.<br/> - The example query above is written over multiple lines for readability, but that does not affect the query. <br/><br/>Can you use an inner join to pair each character name with the actor who plays them?  Select the columns: <strong>character</strong>.<em>name</em>, <strong>character_actor</strong>.<em>actor_name</em>'},

              {'name': 'Multiple joins',
               'short_name': 'multiple_joins',
               'database_type': 'tv_normalized',
               'answer': {'columns': ['name', 'name'],
                          'values': [['Doogie Howser', 'Neil Patrick Harris'],
                                     ['Barney Stinson', 'Neil Patrick Harris'],
                                     ['Lily Aldrin', 'Alyson Hannigan'],
                                     ['Willow Rosenberg', 'Alyson Hannigan']]},
               'prompt': 'In the previous exercise, we explained that TV show character names were not duplicated, so if the name of a character were to change, you would only have to change the name of the character in one row. <br/><br/>However, the previous example was a bit artificial because the TV show names and actor names were duplicated. <br/><br/>In order to not duplicate any names, we need to have more tables, and use multiple joins. <br/><br/>We have tables for characters, TV shows, and actors.  Those tables represent things (also known as entities). <br/><br/>In addition those tables, we have the relationship tables <strong>character_tv_show</strong> and <strong>character_actor</strong>, which capture the relationship between two entities. <br/><br/>This is a flexible way of capturing the relationship between different entities, as some TV show characters might be in multiple shows, and some actors are known for playing multiple characters. <br/><br/>To get each character name with his/her TV show name, we can write <br/><code>SELECT character.name, tv_show.name<br/> FROM character <br/>INNER JOIN character_tv_show<br/> ON character.id = character_tv_show.character_id<br/>INNER JOIN tv_show<br/> ON character_tv_show.tv_show_id = tv_show.id;</code><br/><br/>Can you use two joins to pair each character name with the actor who plays them?  Select the columns: <strong>character</strong>.<em>name</em>, <strong>actor</strong>.<em>name</em>'},

              {'name': 'Joins with WHERE',
               'short_name': 'joins_with_where',
               'required': ['Willow Rosenberg', 'How I Met Your Mother'],
               'custom_error_message': 'You must check that the characters are not named "Willow Rosenberg" and not in the show "How I Met Your Mother".',
               'database_type': 'tv_normalized',
               'answer': {'columns': ['name', 'name'],
                          'values': [['Doogie Howser', 'Doogie Howser, M.D.']]},
               'prompt': 'You can also use joins with the <code>WHERE</code> clause. <br/><br/> To get a list of characters and TV shows that are not in "Buffy the Vampire Slayer" and are not Barney Stinson, you would run: <br/> <code>SELECT character.name, tv_show.name<br/> FROM character <br/>INNER JOIN character_tv_show<br/> ON character.id = character_tv_show.character_id<br/>INNER JOIN tv_show<br/> ON character_tv_show.tv_show_id = tv_show.id WHERE character.name != \'Barney Stinson\' AND tv_show.name != \'Buffy the Vampire Slayer\';</code> <br/><br/>Can you return a list of characters and TV shows that are not named "Willow Rosenberg" and not in the show "How I Met Your Mother"?'},

              {'name': 'Left joins',
               'short_name': 'left_joins',
               'database_type': 'tv_extra',
               'answer': {'columns': ['name', 'name'],
                          'values': [['Doogie Howser', 'Neil Patrick Harris'],
                                     ['Barney Stinson', 'Neil Patrick Harris'],
                                     ['Lily Aldrin', 'Alyson Hannigan'],
                                     ['Willow Rosenberg', 'Alyson Hannigan'],
                                     ['Steve Urkel', null],
                                     ['Homer Simpson', null]]},
               'prompt': 'In the previous exercise, we used joins to match up TV character names with their actors.  When you use <code>INNER JOIN</code>, that is called an "inner join" because it only returns rows where there is data for both the character name and the actor. <br/><br/> However, perhaps you want to get all of the character names, even if there isn\'t corresponding data for the name of the actor.  A <code>LEFT JOIN</code> returns all of the data from the first (or "left") table, and if there isn\'t corresponding data for the second table, it returns <code>NULL</code> for those columns. <br/><br/> Using left joins between character names and TV shows would look like this: <br/><code>SELECT character.name, tv_show.name<br/> FROM character <br/>LEFT JOIN character_tv_show<br/> ON character.id = character_tv_show.character_id<br/> LEFT JOIN tv_show<br/> ON character_tv_show.tv_show_id = tv_show.id;</code> <br/><br/> Can you use left joins to match character names with the actors that play them?  Select the columns: <strong>character</strong>.<em>name</em>, <strong>actor</strong>.<em>name</em> <br/><br/>Note: Other variants of SQL have <code>RIGHT JOIN</code> and <code>OUTER JOIN</code>, but those features are not present in SQLite.'},

              {'name': 'Table alias',
               'short_name': 'table_alias',
               'required': ['AS', 'c.name', 'a.name'],
               'custom_error_message': 'You must use table aliases as described above.',
               'database_type': 'tv_extra',
               'answer': {'columns': ['name', 'name'],
                          'values': [['Doogie Howser', 'Neil Patrick Harris'],
                                     ['Barney Stinson', 'Neil Patrick Harris'],
                                     ['Lily Aldrin', 'Alyson Hannigan'],
                                     ['Willow Rosenberg', 'Alyson Hannigan'],
                                     ['Steve Urkel', null],
                                     ['Homer Simpson', null]]},
               'prompt': 'These queries are starting to get pretty long! <br/><br/>In the previous exercise, we ran a query containing the tables <strong>character</strong>, <strong>tv_show</strong>, and <strong>character_tv_show</strong>.  We can write a shorter query if we used aliases for those tables.  Basically, we create a "nickname" for that table. <br/><br/> If you want to use an alias for a table, you add <code>AS *alias_name*</code> after the table name. <br/><br/> For example, to use left joins between characters and tv shows with aliases, you would run: <br/> <code>SELECT c.name, t.name<br/>FROM character AS c<br/>LEFT JOIN character_tv_show AS ct<br/>ON c.id = ct.character_id<br/>LEFT JOIN tv_show AS t<br/>ON ct.tv_show_id = t.id;</code> <br/><br/> As you can see, it is shorter than the query in the previous exercise.<br/><br/> Can you use left joins to match character names with the actors that play them, and use aliases to make the query shorter?  The aliases for <strong>character</strong>, <strong>character_actor</strong>, and <strong>actor</strong> should be <strong>c</strong>, <strong>ca</strong>, and <strong>a</strong>. <br/><br/>Select the columns: <strong>c</strong>.<em>name</em>, <strong>a</strong>.<em>name</em>'},

              {'name': 'Column alias',
               'short_name': 'column_alias',
               'database_type': 'tv_extra',
               'answer': {'columns': ['character', 'actor'],
                          'values': [['Doogie Howser', 'Neil Patrick Harris'],
                                     ['Barney Stinson', 'Neil Patrick Harris'],
                                     ['Lily Aldrin', 'Alyson Hannigan'],
                                     ['Willow Rosenberg', 'Alyson Hannigan'],
                                     ['Steve Urkel', null],
                                     ['Homer Simpson', null]]},
               'prompt': 'In addition to making aliases for tables, you can also make them for columns. <br/><br/>  This clears up confusion on which column is which.  In the previous exercise, both columns in the result are simply called "name", and that can be confusing. <br/><br/> If you want to use an alias for a column, you add <code>AS *alias_name*</code> after the column name. <br/><br/>  If we wanted to use left joins between character names and TV shows and clearly denote which column has character names, and which has TV show names, it would look like this: <br/><code>SELECT character.name AS character, tv_show.name AS name<br/> FROM character <br/>LEFT JOIN character_tv_show<br/> ON character.id = character_tv_show.character_id<br/> LEFT JOIN tv_show<br/> ON character_tv_show.tv_show_id = tv_show.id;</code> <br/><br/>Can you use left joins to match character names with the actors that play them, and use aliases to call the two columns returned <em>character</em> and <em>actor</em>?'},

              {'name': 'Self joins',
               'short_name': 'self_join',
               'database_type': 'self_join',
               'answer': {'columns': ['employee_name', 'boss_name'],
                        'values': [['Patrick Smith', 'Abigail Reed'],
                                   ['Abigail Reed', 'Bob Carey'],
                                   ['Bob Carey', 'Maxine Tang']]},
               'prompt': 'Sometimes, it may make sense for you to do a self join.  In that case, you need to use table aliases to determine which data is from the "first"/"left" table. <br/><br/>For example, to get a list of Rock Paper Scissors objects and the objects they beat, you can run the following: <br/><code>SELECT r1.name AS object, r2.name AS beats <br/>FROM rps AS r1 <br/>INNER JOIN rps AS r2 <br/>ON r1.defeats_id = r2.id;</code><br/><br/> Can you run a query that returns the name of an employee and the name of their boss?  Use column aliases to make the columns <em>employee_name</em> and <em>boss_name</em>.'},

              {'name': 'LIKE',
               'short_name': 'like',
               'database_type': 'robot',
               'answer': {'columns': ['id', 'name'],
                          'values': [[1, 'Robot 2000'],
                                     [2, 'Champion Robot 2001'],
                                     [4, 'Turbo Robot 2002'],
                                     [5, 'Super Robot 2003'],
                                     [6, 'Super Turbo Robot 2004']]},
               'prompt': 'In SQL, you can use the <code>LIKE</code> command in order to search through text-based values.  With <code>LIKE</code>, there are two special characters: <code>%</code> and <code>_</code>. <br/><br/> The percent sign (<code>%</code>) represents zero, one, or multiple characters. <br/><br/> The underscore (<code>_</code>) represents one character. <br/><br/> For example, <code>LIKE "SUPER _"</code> would match values such as "SUPER 1", "SUPER A", and "SUPER Z". <br/><br/> <code>LIKE "SUPER%"</code> would match any value where <code>SUPER</code> is at the beginning, such as "SUPER CAT", "SUPER 123", or even "SUPER" by itself. <br/><br/> <code>SELECT * FROM robots WHERE name LIKE "%Robot%";</code> would yield all values that contain "Robot" in the name.  Can you run a query that returns "Robot" followed by a year between 2000 and 2099? (So 2015 is a valid value at the end, but 2123 is not.) <br/><br/> Note: <code>LIKE</code> queries are <strong>not</strong> case sensitive.'},

              {'name': 'CASE',
               'short_name': 'case',
               'database_type': 'friends_of_pickles',
               'answer': {'columns': ['id', 'name', 'gender', 'species', 'height_cm', 'sound'],
                          'values': [[1, 'Dave', 'male', 'human', 180, 'talk'],
                                     [2, 'Mary', 'female', 'human', 160, 'talk'],
                                     [3, 'Fry', 'male', 'cat', 30, 'meow'],
                                     [4, 'Leela', 'female', 'cat', 25, 'meow'],
                                     [5, 'Odie', 'male', 'dog', 40, 'bark'],
                                     [6, 'Jumpy', 'male', 'dog', 35, 'bark'],
                                     [7, 'Sneakers', 'male', 'dog', 55, 'bark']]},
               'prompt': 'You can use a <code>CASE</code> statement to return certain values when certain scenarios are true. <br/><br/> A <code>CASE</code> statement takes the following form: <br/><br/> <code>CASE WHEN *first thing is true* THEN *value1*<br/>WHEN *second thing is true* THEN *value2*<br/>...<br/>ELSE *value for all other situations* <br/> END </code> <br/><br/> For example, in order to return the number of legs for each row in <strong>friends_of_pickles</strong>, you could run: <br/> <code>SELECT *, <br/> CASE WHEN species = \'human\' THEN 2 ELSE 4 END AS num_legs <br/> FROM friends_of_pickles;</code><br/><br/> Can you return the results with a column named <em>sound</em> that returns "talk" for humans, "bark" for dogs, and "meow" for cats?'},

              {'name': 'SUBSTR',
               'short_name': 'substr',
               'database_type': 'robot_code',
               'answer': {'columns': ['id', 'name', 'location'],
                          'values': [[1, 'R2000 - Robot 2000', 'New City, NY'],
                                     [3, 'D0001 - Dragon', 'New York City, NY'],
                                     [4, 'R2002 - Turbo Robot 2002', 'Spring Valley, NY'],
                                     [5, 'R2003 - Super Robot 2003', 'Nyack, NY'],
                                     [8, 'U2111 - Unreleased Turbo Robot 2111', 'Buffalo, NY']]},
               'prompt': 'In SQL, you can search for the substring of a given value.  Perhaps a location is stored in the format "city, state" and you just want to grab the state. <br/><br/> SUBSTR is used in this format: <code>SUBSTR(<em>column_name</em>, <em>index</em>, <em>number_of_characters</em>)</code> <br/><br/> <em>index</em> is a number that denotes where you would start the substring.  1 would indicate the first character, 2 would indicated the second character, etc.  The index could also be negative, which means you would count from the end of the string.  -1 would denote the last character, -2 would denote the 2nd to last character, etc. <br/><br/> <em>number_of_characters</em> is optional; if it is not included, the substring contains the "rest of the string". <br/><br/>Here are some examples:<br/> <code>SUBSTR(name, 1, 5)</code> is the first 5 characters of the name. <br/> <code>SUBSTR(name, -4)</code> is the last 4 characters of the name. <br/><br/><code>SELECT * FROM robots WHERE SUBSTR(name, -4) LIKE \'20__\';</code> is another way of returning all of the robots that have been released between 2000 and 2099.<br/><br/>Note: In other versions of SQL, you could use <code>RIGHT</code> to do this.<br/><br/> Can you return all of the robots that are located in NY?'},

              {'name': 'COALESCE',
               'short_name': 'coalesce',
               'database_type': 'fighting',
               'answer': {'columns': ['name', 'weapon'],
                          'values': [['US Marine', 'M1A1 Abrams Tank'],
                                     ['John Wilkes Booth', '.44 caliber Derringer'],
                                     ['Zorro', 'Sword of Zorro'],
                                     ['Innocent Bystander', null]]},
               'prompt': '<code>COALESCE</code> takes a list of columns, and returns the value of the first column that is not null. <br/><br/>Suppose we wanted to find the most powerful weapon that a combatant has on hand.  If value of <em>gun</em> is not null, that is the value returned.  Otherwise, the value of <em>sword</em> is returned.  Then you would run: <br/> <code>SELECT name, COALESCE(gun, sword) AS weapon FROM fighters;</code> <br/><br/> Suppose that a fighter\'s tank could count as a weapon, and it would take precedence over the gun and the sword.  Could you find each fighter\'s weapon in that scenario?'}
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
      sqlstr += "INSERT INTO locação VALUES (8, 3, '2020-10-04', '2020-11-18', , );";
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
    case 'family_null':
      sqlstr = "CREATE TABLE family_members (id int, name char, gender char, species char, favorite_book char);";
      sqlstr += "INSERT INTO family_members VALUES (1, 'Dave', 'male', 'human', 'To Kill a Mockingbird');";
      sqlstr += "INSERT INTO family_members VALUES (2, 'Mary', 'female', 'human', 'Gone with the Wind');";
      sqlstr += "INSERT INTO family_members VALUES (3, 'Pickles', 'male', 'dog', NULL);";
      table_names = ['family_members'];
      break;
    case 'celebs_born':
      sqlstr = "CREATE TABLE celebs_born (id int, name char, birthdate date);";
      sqlstr += "INSERT INTO celebs_born VALUES (1, 'Michael Jordan', '1963-02-17');";
      sqlstr += "INSERT INTO celebs_born VALUES (2, 'Justin Timberlake', '1981-01-31');";
      sqlstr += "INSERT INTO celebs_born VALUES (3, 'Taylor Swift', '1989-12-13');";
      table_names = ['celebs_born'];
      break;
    case 'tv':
      sqlstr = "CREATE TABLE character (id int, name char);";
      sqlstr += "INSERT INTO character VALUES (1, 'Doogie Howser');";
      sqlstr += "INSERT INTO character VALUES (2, 'Barney Stinson');";
      sqlstr += "INSERT INTO character VALUES (3, 'Lily Aldrin');";
      sqlstr += "INSERT INTO character VALUES (4, 'Willow Rosenberg');";
      sqlstr += "CREATE TABLE character_tv_show (id int, character_id int, tv_show_name char);";
      sqlstr += "INSERT INTO character_tv_show VALUES (1, 4, 'Buffy the Vampire Slayer');";
      sqlstr += "INSERT INTO character_tv_show VALUES (2, 3, 'How I Met Your Mother');";
      sqlstr += "INSERT INTO character_tv_show VALUES (3, 2, 'How I Met Your Mother');";
      sqlstr += "INSERT INTO character_tv_show VALUES (4, 1, 'Doogie Howser, M.D.');";
      sqlstr += "CREATE TABLE character_actor (id int, character_id int, actor_name char);";
      sqlstr += "INSERT INTO character_actor VALUES (1, 4, 'Alyson Hannigan');";
      sqlstr += "INSERT INTO character_actor VALUES (2, 3, 'Alyson Hannigan');";
      sqlstr += "INSERT INTO character_actor VALUES (3, 2, 'Neil Patrick Harris');";
      sqlstr += "INSERT INTO character_actor VALUES (4, 1, 'Neil Patrick Harris');";
      table_names = ['character', 'character_tv_show', 'character_actor'];
      break;
    case 'tv_normalized':
      sqlstr = "CREATE TABLE character (id int, name char);";
      sqlstr += "INSERT INTO character VALUES (1, 'Doogie Howser');";
      sqlstr += "INSERT INTO character VALUES (2, 'Barney Stinson');";
      sqlstr += "INSERT INTO character VALUES (3, 'Lily Aldrin');";
      sqlstr += "INSERT INTO character VALUES (4, 'Willow Rosenberg');";
      sqlstr += "CREATE TABLE tv_show (id int, name char);";
      sqlstr += "INSERT INTO tv_show VALUES (1, 'Buffy the Vampire Slayer');";
      sqlstr += "INSERT INTO tv_show VALUES (2, 'How I Met Your Mother');";
      sqlstr += "INSERT INTO tv_show VALUES (3, 'Doogie Howser, M.D.');";
      sqlstr += "CREATE TABLE character_tv_show (id int, character_id int, tv_show_id int);";
      sqlstr += "INSERT INTO character_tv_show VALUES (1, 1, 3);";
      sqlstr += "INSERT INTO character_tv_show VALUES (2, 2, 2);";
      sqlstr += "INSERT INTO character_tv_show VALUES (3, 3, 2);";
      sqlstr += "INSERT INTO character_tv_show VALUES (4, 4, 1);";
      sqlstr += "CREATE TABLE actor (id int, name char);";
      sqlstr += "INSERT INTO actor VALUES (1, 'Alyson Hannigan');";
      sqlstr += "INSERT INTO actor VALUES (2, 'Neil Patrick Harris');";
      sqlstr += "CREATE TABLE character_actor (id int, character_id int, actor_id int);";
      sqlstr += "INSERT INTO character_actor VALUES (1, 1, 2);";
      sqlstr += "INSERT INTO character_actor VALUES (2, 2, 2);";
      sqlstr += "INSERT INTO character_actor VALUES (3, 3, 1);";
      sqlstr += "INSERT INTO character_actor VALUES (4, 4, 1);";
      table_names = ['character', 'tv_show', 'character_tv_show', 'actor', 'character_actor'];
      break;
    case 'tv_extra':
      sqlstr = "CREATE TABLE character (id int, name char);";
      sqlstr += "INSERT INTO character VALUES (1, 'Doogie Howser');";
      sqlstr += "INSERT INTO character VALUES (2, 'Barney Stinson');";
      sqlstr += "INSERT INTO character VALUES (3, 'Lily Aldrin');";
      sqlstr += "INSERT INTO character VALUES (4, 'Willow Rosenberg');";
      sqlstr += "INSERT INTO character VALUES (5, 'Steve Urkel');";
      sqlstr += "INSERT INTO character VALUES (6, 'Homer Simpson');";
      sqlstr += "CREATE TABLE tv_show (id int, name char);";
      sqlstr += "INSERT INTO tv_show VALUES (1, 'Buffy the Vampire Slayer');";
      sqlstr += "INSERT INTO tv_show VALUES (2, 'How I Met Your Mother');";
      sqlstr += "INSERT INTO tv_show VALUES (3, 'Doogie Howser, M.D.');";
      sqlstr += "INSERT INTO tv_show VALUES (4, 'Friends');";
      sqlstr += "CREATE TABLE character_tv_show (id int, character_id int, tv_show_id int);";
      sqlstr += "INSERT INTO character_tv_show VALUES (1, 1, 3);";
      sqlstr += "INSERT INTO character_tv_show VALUES (2, 2, 2);";
      sqlstr += "INSERT INTO character_tv_show VALUES (3, 3, 2);";
      sqlstr += "INSERT INTO character_tv_show VALUES (4, 4, 1);";
      sqlstr += "CREATE TABLE actor (id int, name char);";
      sqlstr += "INSERT INTO actor VALUES (1, 'Alyson Hannigan');";
      sqlstr += "INSERT INTO actor VALUES (2, 'Neil Patrick Harris');";
      sqlstr += "INSERT INTO actor VALUES (3, 'Adam Sandler');";
      sqlstr += "INSERT INTO actor VALUES (4, 'Steve Carell');";
      sqlstr += "CREATE TABLE character_actor (id int, character_id int, actor_id int);";
      sqlstr += "INSERT INTO character_actor VALUES (1, 1, 2);";
      sqlstr += "INSERT INTO character_actor VALUES (2, 2, 2);";
      sqlstr += "INSERT INTO character_actor VALUES (3, 3, 1);";
      sqlstr += "INSERT INTO character_actor VALUES (4, 4, 1);";
      table_names = ['character', 'tv_show', 'character_tv_show', 'actor', 'character_actor'];
      break;
    case 'self_join':
      sqlstr = "CREATE TABLE rps (id int, name char, defeats_id int);";
      sqlstr += "INSERT INTO rps VALUES (1, 'Rock', 3);";
      sqlstr += "INSERT INTO rps VALUES (2, 'Paper', 1);";
      sqlstr += "INSERT INTO rps VALUES (3, 'Scissors', 2);";
      sqlstr += "CREATE TABLE employees (id int, name char, title char, boss_id int);";
      sqlstr += "INSERT INTO employees VALUES (1, 'Patrick Smith', 'Software Engineer', 2);";
      sqlstr += "INSERT INTO employees VALUES (2, 'Abigail Reed', 'Engineering Manager', 3);";
      sqlstr += "INSERT INTO employees VALUES (3, 'Bob Carey', 'Director of Engineering', 4);";
      sqlstr += "INSERT INTO employees VALUES (4, 'Maxine Tang', 'CEO', null);";
      table_names = ['rps', 'employees'];
      break;
    case 'robot':
      sqlstr = "CREATE TABLE robots (id int, name char);";
      sqlstr += "INSERT INTO robots VALUES (1, 'Robot 2000');";
      sqlstr += "INSERT INTO robots VALUES (2, 'Champion Robot 2001');";
      sqlstr += "INSERT INTO robots VALUES (3, 'Dragon');";
      sqlstr += "INSERT INTO robots VALUES (4, 'Turbo Robot 2002');";
      sqlstr += "INSERT INTO robots VALUES (5, 'Super Robot 2003');";
      sqlstr += "INSERT INTO robots VALUES (6, 'Super Turbo Robot 2004');";
      sqlstr += "INSERT INTO robots VALUES (7, 'Not A Robot');";
      sqlstr += "INSERT INTO robots VALUES (8, 'Unreleased Turbo Robot 2111');";
      table_names = ['robots'];
      break;
    case 'robot_code':
      sqlstr = "CREATE TABLE robots (id int, name char, location char);";
      sqlstr += "INSERT INTO robots VALUES (1, 'R2000 - Robot 2000', 'New City, NY');";
      sqlstr += "INSERT INTO robots VALUES (2, 'R2001 - Champion Robot 2001', 'Palo Alto, CA');";
      sqlstr += "INSERT INTO robots VALUES (3, 'D0001 - Dragon', 'New York City, NY');";
      sqlstr += "INSERT INTO robots VALUES (4, 'R2002 - Turbo Robot 2002', 'Spring Valley, NY');";
      sqlstr += "INSERT INTO robots VALUES (5, 'R2003 - Super Robot 2003', 'Nyack, NY');";
      sqlstr += "INSERT INTO robots VALUES (6, 'R2004 - Super Turbo Robot 2004', 'Tampa, FL');";
      sqlstr += "INSERT INTO robots VALUES (7, 'N0001 - Not A Robot', 'Seattle, WA');";
      sqlstr += "INSERT INTO robots VALUES (8, 'U2111 - Unreleased Turbo Robot 2111', 'Buffalo, NY');";
      table_names = ['robots'];
      break;
    case 'fighting':
      sqlstr = "CREATE TABLE fighters (id int, name char, gun char, sword char, tank char);";
      sqlstr += "INSERT INTO fighters VALUES (1, 'US Marine', 'Colt 9mm SMG', 'Swiss Army Knife', 'M1A1 Abrams Tank');";
      sqlstr += "INSERT INTO fighters VALUES (2, 'John Wilkes Booth', '.44 caliber Derringer', null, null);";
      sqlstr += "INSERT INTO fighters VALUES (3, 'Zorro', null, 'Sword of Zorro', null);";
      sqlstr += "INSERT INTO fighters VALUES (4, 'Innocent Bystander', null, null, null);";
      table_names = ['fighters'];
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
  $('#lesson-name').text("Lesson " + current_level + ": " + lesson_name);
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
