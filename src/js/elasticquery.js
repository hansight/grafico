/**
 * Using elastic.js, map sql to elastic dsl and get results
 */
var ast = simpleSqlParser.sql2ast('select * from tweets AS AA sf');
console.log(ast);