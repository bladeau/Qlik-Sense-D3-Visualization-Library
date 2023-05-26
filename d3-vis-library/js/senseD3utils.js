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
    //console.log(dataSet);
    var parentsA = [];
    var kidsA = [];
    var happyData = [];

    for (var i = 0; i < dataSet.length; i++) {
      var d = dataSet[i]; //the current node
      var parentPath = "[root]";

      for (var j = 0; j < numDims - 1; j++) {
        //Goes through the dimensions except for final level and measure
        var parentVal = "";
        if (!d[j].qText || d[j].qText === "-" || d[j].qText === "" || d[j].qText === " ") {
          parentVal = "[root]";
        } else {
          parentVal = d[j].qText;
        }

        var childVal = d[j + 1].qText; //eventually gets the final level but not the measure

        if (!parentsA.includes(parentVal)) {
          parentsA.push(parentVal);
        }

        if (!kidsA.includes(childVal)) {
          kidsA.push(childVal);
        }

        const exists = happyData.some((item) => item.parent === parentVal && item.name === childVal);

        if (!exists) {
          var newPath = parentPath + " > " + parentVal; // + " > " + childVal;
          if (parentVal === "[root]") {
            newPath = parentVal; // + " > " + childVal;
          }

          var newDataSet = {
            name: childVal,
            parent: parentVal,
            size: d[numDims].qNum,
            leaf: j + 1 === numDims - 1,
            parentpath: newPath,
          };
          happyData.push(newDataSet);
        }
        parentPath += " > " + parentVal;
      }
    }

    // console.log(JSON.stringify(happyData, null, "\t"));
    //loop through the parent and child arrays and find the parents which aren't children.  set those to have a parent of "-", indicating that they're the top parent
    parentsA.forEach((parent) => {
      if (!kidsA.includes(parent.toString())) {
        const noParent = {
          name: parent.toString(),
          parent: "[root]",
          parentpath: "[root] > " + parent.toString(),
        };
        happyData.push(noParent);
      }
    });

    console.log(happyData);
    //crawl through the data to create the family tree in JSON
    function getChildren(inputData, name = "[root]", parentPath = null, parentSize = 0) {
      var children = inputData
        .filter(function (d) {
          if (d.parentpath === parentPath + " > " + d.parent) {
            if (d.leaf) {
              return d.parent === name;
            } else {
              return d.parentpath === parentPath + " > " + d.parent;
            }
          } else {
            if (!d.leaf) {
              return d.parent === name;
            }
          }
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
    // console.log(JSON.stringify(JSONtree, null, "\t"));
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
