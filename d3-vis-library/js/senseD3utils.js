var senseD3 = {
  arcTween: function (d, x, y, radius, arc) {
    var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
      yd = d3.interpolate(y.domain(), [d.y, 1]),
      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
    return function (d, i) {
      return i
        ? function (t) {
            return arc(d);
          }
        : function (t) {
            x.domain(xd(t));
            y.domain(yd(t)).range(yr(t));
            return arc(d);
          };
    };
  },
  computeTextRotation: function (d, x) {
    return ((x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI) * 180;
  },
  //create family is to be used for creating a tree type data structure which can be used in most D3 tree vizualizations.
  //See more info about the tree layout here:  https://github.com/mbostock/d3/wiki/Tree-Layout
  createFamily: function (dataSet, numDims) {
    var numDims;
    if (arguments.length == 1) {
      numDims = 2;
    }

    //create arrays of parents and children.  this is so we can determine if there's any nodes without parents.  these would be the top parents
    var parentsA = [];
    var kidsA = [];

    //format Sense data into a more easily consumable format and build the parent/child arrays

    var happyData = [];

    for (s in dataSet) {
      var d = dataSet[s];
      var parentPath = "[root]"; // Initialize parentPath as [root] for the level under root

      for (i = 0; i < numDims - 1; i++) {
        if (parentsA.indexOf(d[i].qText) === -1) {
          parentsA.push(d[i].qText);
        }

        var parentVal = "";
        if (!d[i].qText || d[i].qText === "-" || d[i].qText === "" || d[i].qText === " ") {
          parentVal = "[root]";
        } else {
          parentVal = d[i].qText;
        }

        if (kidsA.indexOf(d[i + 1].qText) === -1) {
          kidsA.push(d[i + 1].qText);
        }

        var exists = false;
        $.each(happyData, function () {
          if (this.parent === parentVal && this.name === d[i + 1].qText) {
            exists = true;
          }
        });

        if (!exists) {
          var newPath = parentPath + " > " + parentVal + " > " + d[i + 1].qText;
          if (parentVal === "[root]") {
            newPath = parentVal + " > " + d[i + 1].qText;
          }

          var newDataSet = {
            name: d[i + 1].qText,
            parent: parentVal,
            size: d[numDims].qNum,
            leaf: i + 1 === numDims - 1 ? true : false,
            parentpath: newPath, // Update parentpath to include complete path
          };
          happyData.push(newDataSet);
        }

        // Update parentPath for the next iteration
        parentPath += " > " + parentVal;
      }
    }

    //loop through the parent and child arrays and find the parents which aren't children.  set those to have a parent of "-", indicating that they're the top parent
    $.each(parentsA, function () {
      if (kidsA.indexOf(this.toString()) === -1) {
        var noParent = {
          name: this.toString(),
          parent: "[root]",
        };
        happyData.push(noParent);
      }
    });

    //crawl through the data to create the family tree in JSON
    function getChildren(inputData, name = "[root]", parentPath = null, parentSize = 0) {
      var children = inputData
        .filter(function (d) {
          if (d.leaf) {
            console.log("leaf is: " + JSON.stringify(d, null, "\t"));
          }
          if (d.parentpath === parentPath + " > " + d.parent) {
            return d.parentpath === parentPath + " > " + d.parent;
          } else {
            return d.parent === name;
          }
          // return d.parentpath === parentPath + " > " + name;
          return d.parent === name;
        })
        .map(function (d) {
          var mapping;
          if (parentPath == null) {
            parentPath = "[root]";
          }
          if (d.leaf) {
            mapping = {
              id: parentPath + " > " + d.name,
              name: d.name,
              size: d.size,
              totalsize: d.size,
            };
          } else {
            var childSize = d.size;

            var childChildren = getChildren(inputData, d.name, d.parentpath, childSize);

            var totalSize = childChildren.reduce(function (acc, child) {
              return acc + child.totalsize;
            }, 0);

            mapping = {
              id: parentPath + " > " + d.name,
              //  id: parentPath + "|" + d.name,
              name: d.name,
              size: childSize,
              totalsize: totalSize + parentSize,
              children: childChildren,
            };
          }

          return mapping;
        });

      return children;
    }

    var JSONtree = getChildren(happyData);
    console.log(JSONtree);
    return JSONtree;
  },
  // Traverse the dataset to find the maximum value of a
  // specified attribute from all of the nodes in the passed dataset
  findMaxValue: function (attr, dataSet) {
    var maxValue = 0;
    dataSet.forEach(function (d) {
      maxValue = d[attr] > maxValue ? d[attr] : maxValue;
    });
    return maxValue;
  },
};
