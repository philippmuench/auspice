import { rgb } from "d3-color";
import { interpolateRgb } from "d3-interpolate";
import { updateVisibleTipsAndBranchThicknesses} from "../../../actions/tree";
import { branchOpacityFunction } from "../../../util/colorHelpers";
import { NODE_VISIBLE } from "../../../util/globals";

/* Callbacks used by the tips / branches when hovered / selected */

export const onTipHover = function onTipHover(d) {
  if (d.visibility !== NODE_VISIBLE) return;
  const phylotree = d.that.params.orientation[0] === 1 ?
    this.state.tree :
    this.state.treeToo;
  phylotree.svg.select("#tip_" + d.n.clade)
    .attr("r", (e) => e["r"] + 4);
  this.setState({
    hovered: {d, type: ".tip"}
  });
};

export const onTipClick = function onTipClick(d) {
  if (d.visibility !== NODE_VISIBLE) return;
  if (this.props.narrativeMode) return;
  // console.log("tip click", d)
  this.setState({
    hovered: null,
    selectedTip: d
  });
  /* are we clicking from tree1 or tree2? */
  const tipSelected = d.that.params.orientation[0] === 1 ?
    {treeIdx: d.n.arrayIdx} :
    {treeTooIdx: d.n.arrayIdx};
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses({tipSelected, cladeSelected: this.props.tree.selectedClade}));
};


export const onBranchHover = function onBranchHover(d) {
  if (d.visibility !== NODE_VISIBLE) return;
  /* emphasize the color of the branch */
  for (const id of ["#branch_S_" + d.n.clade, "#branch_T_" + d.n.clade]) {
    if (this.props.colorByConfidence) {
      this.state.tree.svg.select(id)
        .style("stroke", (el) => { // eslint-disable-line no-loop-func
          const ramp = branchOpacityFunction(this.props.tree.nodes[el.n.arrayIdx].attr[this.props.colorBy + "_entropy"]);
          const raw = this.props.tree.nodeColors[el.n.arrayIdx];
          const base = el.branchStroke;
          return rgb(interpolateRgb(raw, base)(ramp)).toString();
        });
    } else {
      this.state.tree.svg.select(id)
        .style("stroke", (el) => this.props.tree.nodeColors[el.n.arrayIdx]);
    }
  }
  if (this.props.temporalConfidence.exists && this.props.temporalConfidence.display && !this.props.temporalConfidence.on) {
    const tree = d.that.params.orientation[0] === 1 ? this.state.tree : this.state.treeToo;
    if (!("confidenceIntervals" in tree.groups)) {
      tree.groups.confidenceIntervals = tree.svg.append("g").attr("id", "confidenceIntervals");
    }
    tree.groups.confidenceIntervals
      .selectAll(".conf")
      .data([d])
      .enter()
        .call((sel) => tree.drawSingleCI(sel, 0.5));
  }
  this.setState({
    hovered: {d, type: ".branch"}
  });
};

export const onBranchClick = function onBranchClick(d) {
  if (d.visibility !== NODE_VISIBLE) return;
  if (this.props.narrativeMode) return;
  const root = [undefined, undefined];
  let cladeSelected;
  if (d.n.attr.labels !== undefined && d.n.attr.labels.clade !== undefined) {
    cladeSelected = d.n.attr.labels.clade;
  }
  if (d.that.params.orientation[0] === 1) root[0] = d.n.arrayIdx;
  else root[1] = d.n.arrayIdx;
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses({root, cladeSelected}));
};

/* onBranchLeave called when mouse-off, i.e. anti-hover */
export const onBranchLeave = function onBranchLeave(d) {
  for (const id of ["#branch_T_" + d.n.clade, "#branch_S_" + d.n.clade]) {
    this.state.tree.svg.select(id)
      .style("stroke", (el) => el.branchStroke);
  }
  if (this.props.temporalConfidence.exists && this.props.temporalConfidence.display && !this.props.temporalConfidence.on) {
    const tree = d.that.params.orientation[0] === 1 ? this.state.tree : this.state.treeToo;
    tree.removeConfidence();
  }
  if (this.state.hovered) {
    this.setState({hovered: null});
  }
};

export const onTipLeave = function onTipLeave(d) {
  const phylotree = d.that.params.orientation[0] === 1 ?
    this.state.tree :
    this.state.treeToo;
  if (!this.state.selectedTip) {
    phylotree.svg.select("#tip_" + d.n.clade)
      .attr("r", (dd) => dd["r"]);
  }
  if (this.state.hovered) {
    this.setState({hovered: null});
  }
};

/* clearSelectedTip when clicking to go away */
export const clearSelectedTip = function clearSelectedTip(d) {
  const phylotree = d.that.params.orientation[0] === 1 ?
    this.state.tree :
    this.state.treeToo;
  phylotree.svg.select("#tip_" + d.n.clade)
    .attr("r", (dd) => dd["r"]);
  this.setState({selectedTip: null, hovered: null});
  /* restore the tip visibility! */
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses(
    {tipSelected: {clear: true}, cladeSelected: this.props.tree.selectedClade}
  ));
};

/**
 * @param  {node} d tree node object
 * @param  {int} n total number of nodes in current view
 * @return {int} font size of the tip label
 */
export const tipLabelSize = (d, n) => {
  if (n > 70) {
    return 0;
  } else if (n < 20) {
    return 14;
  }
  const fs = 6 + 8 * (70 - n) / (70 - 20);
  return fs;
};
