class Dashing.Fullpie extends Dashing.Widget
  @accessor 'value'

  onData: (data) ->
    $(@node).fadeOut().fadeIn()
    @render(data.value)
  
  render: (data) ->
    if !data
      data = @get("value")
    if !data
       return
    #console.log "FullPie new"
    # this is a fix because data binding seems otherwise not work
    $(@node).children(".title").text($(@node).attr("data-title"))
    $(@node).children(".more-info").text($(@node).attr("data-moreinfo"))
    $(@node).children(".updated-at").text(@get('updatedAtMessage'))

    width = 240 #width
    height = 240 #height
    radius = 120 #radius

    color = d3.scale.ordinal()
      .domain([1,10])
      #.range( ['#222222','#555555','#777777','#999999','#bbbbbb','#dddddd','#ffffff'] )
      .range( ['#106CB8','#333333','#EF3D3D','#6fbb3c','#666666','#777777','#888888','#999999','#aaaaaa'] )

    $(@node).children("svg").remove();

    vis = d3.select(@node).append("svg:svg")
      .data([data])
        .attr("width", width)
        .attr("height", height)
        .append("svg:g")
        .attr("transform", "translate(" + radius + "," + radius + ")") 

    arc = d3.svg.arc().outerRadius(radius)
    pie = d3.layout.pie().value((d) -> d.value)

    arcs = vis.selectAll("g.slice")
      .data(pie)
      .enter().append("svg:g").attr("class", "slice") 

    arcs.append("svg:path").attr("fill", (d, i) -> color i)
      .attr("fill-opacity", 1).attr("d", arc)

    sum=0
    for val in data  
      sum += val.value

    arcs.append("svg:text").attr("transform", (d, i) -> 
      procent_val = Math.round(data[i].value/sum * 100)
      d.innerRadius = (radius * (100-procent_val)/100) - 50  #45=max text size/2
      d.outerRadius = radius
      "translate(" + arc.centroid(d) + ")")
      .attr('fill', "#fff")
      .attr("text-anchor", "middle").text((d, i) -> data[i].label)
      .append('svg:tspan')
      .attr('x', 0)
      .attr('dy', 30)
      .attr('font-size', '150%')
      .text((d,i) -> Math.round(data[i].value/sum * 100) + '%')
                              
                              
                               