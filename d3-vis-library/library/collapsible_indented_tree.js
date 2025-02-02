var viz = function ($element, layout, _this) {
  var id = senseUtils.setupContainer($element, layout, "d3vl_collapse_indented_tree"),
    ext_width = $element.width(),
    ext_height = $element.height();

  var data = layout.qHyperCube.qDataPages[0].qMatrix;

  var dim_count = layout.qHyperCube.qDimensionInfo.length;

  var root = { name: layout.title, children: senseD3.createFamily(data, dim_count) };

  var margin = { top: 30, right: 20, bottom: 30, left: 20 },
    width = ext_width - margin.left - margin.right - 20,
    barHeight = 20,
    barWidth = width * 0.8;

  var i = 0,
    duration = 400;

  var tree = d3.layout.tree().nodeSize([0, 20]);

  var diagonal = d3.svg.diagonal().projection(function (d) {
    return [d.y, d.x];
  });

  d3.select("#" + id)
    .style("width", ext_width)
    .style("height", ext_height)
    .style("overflow", "auto");

  var svg = d3
    .select("#" + id)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  root.x0 = 0;
  root.y0 = 0;
  update(root);
  if (layout.responsive) {
    root.children.forEach(function (n) {
      click(n);
    });
  }

  function update(source) {
    // Compute the flattened node list. TODO use d3.layout.hierarchy.
    var nodes = tree.nodes(root);

    var height = Math.max(ext_height - 20, nodes.length * barHeight + margin.top + margin.bottom);

    d3.select("#" + id + " svg")
      .transition()
      .duration(duration)
      .attr("height", height);

    // Compute the "layout".
    nodes.forEach(function (n, i) {
      n.x = i * barHeight;
    });

    // Update the nodes…
    var node = svg.selectAll("g.node").data(nodes, function (d) {
      return d.id || (d.id = ++i);
    });

    var nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .style("opacity", 1e-6);

    // Enter any new nodes at the parent's previous position.
    nodeEnter
      .append("rect")
      .each(function (d) {
        d.classDim = d.depth > 0 ? layout.qHyperCube.qDimensionInfo[d.depth - 1].qFallbackTitle.replace(/\s+/g, "-") : "-";
        d.cssID = d.name.replace(/\s+/g, "-");
      })
      .attr("class", function (d) {
        return d.children ? "parent " + d.classDim : "child " + d.classDim;
      })
      .attr("id", function (d) {
        return d.cssID;
      })
      .attr("y", -barHeight / 2)
      .attr("height", barHeight)
      .attr("width", barWidth)
      .style("fill", color)
      .on("click", click)
      .on("mouseover", function (d) {
        d3.selectAll($("." + d.classDim + "#" + d.cssID)).classed("highlight", true);
        d3.selectAll($("." + d.classDim + "[id!=" + d.cssID + "]")).classed("dim", true);
        d3.selectAll($("circle" + "[id!=" + d.cssID + "]")).classed("dim", true);
      })
      .on("mouseout", function (d) {
        d3.selectAll($("." + d.classDim + "#" + d.cssID)).classed("highlight", false);
        d3.selectAll($("." + d.classDim + "[id!=" + d.cssID + "]")).classed("dim", false);
        d3.selectAll($("circle" + "[id!=" + d.cssID + "]")).classed("dim", false);
      });

    nodeEnter
      .append("text")
      .attr("dy", 3.5)
      .attr("dx", 5.5)
      .text(function (d) {
        return d.size + " - " + d.name;
      });

    // Transition nodes to their new position.
    nodeEnter
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      })
      .style("opacity", 1);

    node
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      })
      .style("opacity", 1)
      .select("rect")
      .style("fill", color);

    // Transition exiting nodes to the parent's new position.
    node
      .exit()
      .transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .style("opacity", 1e-6)
      .remove();

    // Update the links…
    var link = svg.selectAll("path.link").data(tree.links(nodes), function (d) {
      return d.target.id;
    });

    // Enter any new links at the parent's previous position.
    link
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("d", function (d) {
        var o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      })
      .transition()
      .duration(duration)
      .attr("d", diagonal);

    // Transition links to their new position.
    link.transition().duration(duration).attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        var o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
      // if(d.depth == 1){
      // 	click(d);
      // }
    });
  }

  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }

  function color(d) {
    return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
  }
  var b;
};
