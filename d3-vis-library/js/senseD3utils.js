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
    const parentsA = []; // Array to store unique parent values
    const kidsA = []; // Array to store unique child values
    const formattedData = []; // Array to store the formatted data

    for (let i = 0; i < dataSet.length; i++) {
      const d = dataSet[i]; // Current node

      let parentPath = "[root]"; // Initialize parentPath as [root] for the level under root

      for (let j = 0; j < numDims - 1; j++) {
        // Iterate through the dimensions except for the final level and measure

        let parentVal = d[j].qText;

        const childVal = d[j + 1].qText; // Get the value of the next dimension (child value)

        if (!parentsA.includes(parentVal)) {
          parentsA.push(parentVal); // Add parent value to the parentsA array if it doesn't exist already
        }

        if (!kidsA.includes(childVal)) {
          kidsA.push(childVal); // Add child value to the kidsA array if it doesn't exist already
        }

        const newPath = parentPath + " > " + parentVal; // Construct the complete path including parent and child values
        if (parentVal === "[root]") {
          newPath = parentVal; // Special case: if parent is [root], exclude it from the path
        }

        const newDataSet = {
          name: childVal,
          parent: parentVal,
          size: d[numDims].qNum, // Assign size as the value of the measure in the last dimension
          leaf: j + 1 === numDims - 1, // Determine if it is a leaf node (last dimension)
          parentpath: newPath, // Update parentpath to include the complete path
        };

        formattedData.push(newDataSet); // Add the new formatted data entry to formattedData

        parentPath = newPath; // Update parentPath for the next iteration by using the current newPath
      }
    }

    // console.log(JSON.stringify(formattedData, null, "\t"));
    // Loop through the parent and child arrays and find the parents which aren't children. Set those to have a parent of "-", indicating that they're the top parent
    parentsA.forEach((parent) => {
      if (!kidsA.includes(parent.toString())) {
        const noParent = {
          name: parent.toString(),
          parent: "[root]",
          parentpath: "[root] > " + parent.toString(),
        };
        formattedData.push(noParent);
      }
    });

    console.log(formattedData);

    // Crawl through the data to create the family tree in JSON
    function getChildren(inputData, name = "[root]", parentPath = null, parentSize = 0) {
      // Filter the inputData based on the parent-child relationship and create children array
      const children = inputData
        .filter(function (d) {
          if (d.parentpath === parentPath + " > " + d.parent) {
            // Check if the current entry is a child of the specified parent
            return d.leaf ? d.parent === name : d.parentpath === parentPath + " > " + d.parent;
          } else {
            // Handle the case when parentPath doesn't match, but it's not a leaf node and has the correct parent
            return !d.leaf && d.parent === name;
          }
        })
        .map(function (d) {
          let mapping;
          if (parentPath == null) {
            parentPath = "[root]"; // Set parentPath to "[root]" if it is null
          }
          if (d.leaf) {
            // Create the mapping object for leaf nodes
            mapping = {
              id: parentPath + " > " + d.name,
              name: d.name,
              size: d.size,
              totalsize: d.size,
            };
          } else {
            const childSize = d.size;

            // Recursively call the getChildren function to create children for non-leaf nodes
            const childChildren = getChildren(inputData, d.name, d.parentpath, childSize);

            // Calculate the total size by summing up the sizes of all children
            const totalSize = childChildren.reduce(function (acc, child) {
              return acc + child.totalsize;
            }, 0);

            // Create the mapping object for non-leaf nodes
            mapping = {
              id: parentPath + " > " + d.name,
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

    var JSONtree = getChildren(formattedData);

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
