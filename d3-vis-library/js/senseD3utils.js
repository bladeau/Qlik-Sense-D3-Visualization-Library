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

    const parentsA = []; // Array to store unique parent values

    const kidsA = []; // Array to store unique child values

    const formattedData = []; // Array to store the formatted data

    for (s in dataSet) {
      var d = dataSet[s]; // Current node

      let parentPath = "[root]"; // Initialize parentPath as [root] for the level under root

      for (i = 0; i < numDims - 1; i++) {
        // Iterate through the dimensions except for the final level and measure

        let parentVal = "";

        if (!d[i].qText || d[i].qText === "-" || d[i].qText === "" || d[i].qText === " ") {
          parentVal = "[root]"; //Has a root value
        } else {
          parentVal = d[i].qText; //Is a parent in this iteration through the dimensions
        }

        const childVal = d[i + 1].qText; // Get the value of the next dimension to be iterated (currently a child value)

        if (!parentsA.includes(parentVal)) {
          parentsA.push(parentVal);
        }

        if (!kidsA.includes(childVal)) {
          kidsA.push(childVal); // Add child value to the kidsA array if it doesn't exist already
        }

        const newPath = parentPath + " > " + parentVal; // Construct the complete path including parent and child values

        if (parentVal === "[root]") {
          newPath = parentVal; // Special case: if parent is [root], exclude it from the path
        }
        const exists = formattedData.some((item) => item.parentpath === newPath && item.name === childVal); //Make sure it  does not already exist in formatted Array

        if (!exists) {
          var newDataSet = {
            name: childVal,

            parent: parentVal,

            size: d[numDims].qNum,

            leaf: i + 1 === numDims - 1 ? true : false,

            parentpath: newPath, // Update parentpath to include complete path
          };

          formattedData.push(newDataSet);
        }

        // Update parentPath for the next iteration

        parentPath += " > " + parentVal;
      }
    }

    //loop through the parent and child arrays and find the parents which aren't children.  set those to have a parent of "-", indicating that they're the top parent

    parentsA.forEach((parent) => {
      if (!kidsA.includes(parent)) {
        const noParent = {
          name: parent,

          parent: "[root]",

          parentpath: "[root] > " + parent,
        };

        formattedData.push(noParent);
      }
    });

    console.log("----------------------1-------------------------");

    console.log(JSON.stringify(formattedData, null, "\t"));

    // formatted data exists////////////////////////////////////

    function getChildren(inputData, name = "[root]", parentPath = null, parentSize = 0) {
      var children = inputData

        .filter(function (d) {
          if (d.parentpath === parentPath + " > " + d.parent) {
            //console.log(d);

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
              d: d,

              id: parentPath + " > " + d.parent + " > " + d.name,

              name: d.name,

              size: d.size,

              totalsize: d.size,
            };
          } else {
            var childSize = d.size;

            var childChildren = getChildren(inputData, d.name, d.parentpath, childSize);

            mapping = {
              d: d,

              id: parentPath + " > " + d.name,

              //  id: parentPath + "|" + d.name,

              name: d.name,

              size: childSize,

              totalsize: d.totalSize,

              children: childChildren,
            };
          }

          return mapping;
        });

      return children;
    }

    ////////////////////////////////////////////

    // Example usage

    var JSONtree = getChildren(formattedData);

    //console.log('-------------------2----------------------------');

    //console.log(JSON.stringify(JSONtree, null, "\t"));

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
