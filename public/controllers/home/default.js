// JavaScript for the default page

//onclick functions
var paraID = d3.select(this).attr("id");
if (paraID == "iswave") {
    d3.selectAll("circle")
        .transition()
        .duration(2000)
        .attr("r", "3")
        .attr("fill", "blue");
};