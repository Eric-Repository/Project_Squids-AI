/**
*  Student Number: 214429476
*  Assignment Number: Final
*  Name: Eric Lin, Martin Harriott, Yodhin Singh
*  Assignment Name: Squids - Natural Selection
*  Interaction:
*        Enter: Resets the simulation (See block comment at bottom)
*        Refresh page: Reset the simulation (See block comment)
*        "f": Speed up the simulation process
*        "c": Modifies the environment/coral
**/ 


/**
*  Initialization and Declaration of variables and constants
*  changing these parameters will strongly affect emergent behaviour
**/
// A string that contains all the possible nucleotides for the squids
let lexiconSquid = "+-/".split("");
// A string that contains all the possible nucleotides for the fish
let lexiconAgent = "xy/".split("");

// The scale of this value determines the chance that a nucleotide in the organism's DNA strand will mutate
let mutability = 1;
let size = 10;

// Limits the maximum speed for fish
let max_speed = 0.005;
// Limits the maximum speed for squids
let predator_max_speed = 0.0025;

// Limits the max acceleration for fish
let max_force = 0.0005;
// Limits the max acceleration for squids
let predator_max_force = 0.00025;

// Controls strength of the grouping for the fish
let centering_factor = 0.001;
// Controls the strength of avoidance for the fish
let avoidance_factor = 1;

// The opimal distance between fish
let agent_optimal_distance = 0.005;
// The optimal distance agents want to stay away from squids
let predator_optimal_distance = 0.075;

// The agent's range of view
let agent_range_of_view = 0.02;
// The predator's range of view
let predator_range_of_view = 0.1;

// The agent's field of view
let agent_field_of_view = 2.5;
// The predator's field of view
let predator_field_of_view = 5;

// The deviation that the fish and squids will take away/toward the group
let random_walk_variance = 1.5;

// The fish that will be flocking together and avoiding obstacles
let agents = [];
// The red coral on the map for the fish and squids to avoid
let obstacles = [];
// The squids that will be randomly roaming the field
let predators = [];

// The amount of time each generation needs to survive for
let generationTimeGoal = 10;
let generationTimer = 0;

// These variables can be changed and modified by user
// Set the grid size
let dim = 75;
// set the grid as smooth or not
let isSmooth = true;

// These variables cannot be changed
// There are 2 grids that made with size 'dim', one contains the present grid, the other contains the grid that will follow
let grid = new field2D(dim);
let gridnext = new field2D(dim);
// This is the lowest value a field can have (used to determine if the field is empty of coral)
let gridLowestVal = 0;
// These are the modifiers that balance the colour of the coral on the field
let coralGrowth = [6,3];
let coralLoss = [4,2];
// This internal timer keeps track of how often to update the coral
let environmentTimer = 0;


/**
*  This function creates an organism
*  @param  size  The number of nucleotides in the DNA strand
**/
function countChar(cmds, char)
{
  // Initializes the counter
  let charCount = 0;
  // Loops through the cmds and counts the number of times a character appears
  for (let i = 0; i < cmds.length; i ++)
  {
    let character = cmds[i];
    if (character == char)
      {
        charCount++;
      }
  }
  return charCount
}


/**
*  This function creates an organism
*  @param  size  The number of nucleotides in the DNA strand
**/
function create(size, lex) 
{
  // An array that contains the organism's genomes
  let geno = []
  // The organisms will have random genomes on creation
  for (let i=0; i < size; i++) 
  {
    geno.push( lex[random(lex.length)] )  
  }
  return geno;
}


/**
*  This function creates the next generation of squid predators
**/
function regeneratePredators() 
{
  // Resets the generation timer
  generationTimer = 0;
  // The new populations
  let newpop = []
  let index = 0;
  
  // Goes through each of the organisms in the new population
  for (let i=0; i < 5; i++) 
  {
    // Creates a new organism
    let child = 
    {
      // The DNA string of the squid
      cmds: [],
      // The number of + nucleotides in the DNA string
      plus: 0,
      // The number of - nucleotides in the DNA string
      minus: 0,
      // Gives the squid a position
      pos: new vec2(random(), random()),
      // Gives the squid a maximum speed
      vel: vec2.random(random() * predator_max_speed),
      // Creates a variable to hold the squid's acceleration
      // This variable will be empty upon creation
      // The squid will have no acceleration upon creation
      // This will result in the squid having a fixed velocity at spawn
      acceleration: new vec2(),
      // Sets the squid's size;
      size: 0.01,
      // The current colour of the squid
      hslColour: random(),
      // The rate at which this squid changes colours
      // The more fish a squid eats, the faster it changes colours
      hslChange: 0,
      saturation: 0.5,
      lightness: 0,
      // The camoflauge of the squid is determined by its genetics
      camoflaugeRange: 0,
      isDead: false,
      // Metabolism deterines how often a squid needs to eat to sustain itself
      metabolism: 5,
      timer: 0,
      // The squid's tentacles
      tentacleTrail: [],
      tentacleTimer: 0.1
    }
    
    // The DNA strand of the parent is used as the base DNA strand for the child
    for (let j=0; j<predators[index].cmds.length; j++) 
    {
      // If the random chance of mutation is less than the threshold, the current nucleotide will mutate
      // This is done to allows new elements to (re)emerge into the population
      // This is done to prevent the population from stagnating
      if (random() < mutability / predators[index].cmds.length) 
      {
        child.cmds[j] = lexiconSquid[random(lexiconSquid.length)]
      } 
      // Otherwise the current nucleotide remains the same
      else 
      {
        child.cmds[j] = predators[index].cmds[j];
      }
    }
    
    // The max length of an squid's DNA string is 50
    // An squid's DNA string can only ever hold 50 nucleotides
    if (child.cmds.length > 50) 
    {
      child.cmds.length =  50;
    }
    
    updatePredator(child);
    
    // Adds the new squid to the population
    newpop[i] = child
    index ++;
    if (index >= predators.length)
      {
        index = 0;
      }
  }
  // Updates the population
  predators = newpop;
}


/**
*  This function creates the next generation of fish
**/
function regeneratePrey() 
{
  // Resets the generation timer
  generationTimer = 0;
  // The new populations
  let newpop = []
  let index = 0;
  
  // Goes through each of the fish in the new population
  for (let i=0; i < 100; i++) 
  {
    // Creates a new fish
    let child = 
    {
      // The DNA string of the fish
      cmds: [],
      // The number of + nucleotides in the DNA string
      pink: 0,
      // The number of - nucleotides in the DNA string
      blue: 0,
      // Gives the fish a position
      pos: new vec2(random(), random()),
      // Gives the fish a maximum speed
      vel: vec2.random(random() * max_speed),
      // Creates a variable to hold the fish's acceleration
      // This variable will be empty upon creation
      // The fish will have no acceleration upon creation
      // This will result in the fish having a fixed velocity at spawn
      acceleration: new vec2(),
      // Sets the fish's size;
      flockingFactor: 0,
      size: (random() + 1)/100,
      colour: [],
      isEaten: false,
    }
    
    // The DNA strand of the parent is used as the base DNA strand for the child
    for (let j=0; j<agents[index].cmds.length; j++) 
    {
      // If the random chance of mutation is less than the threshold, the current nucleotide will mutate
      // This is done to allows new elements to (re)emerge into the population
      // This is done to prevent the population from stagnating
      if (random() < mutability / agents[index].cmds.length) 
      {
        child.cmds[j] = lexiconAgent[random(lexiconAgent.length)]
      } 
      // Otherwise the current nucleotide remains the same
      else 
      {
        child.cmds[j] = agents[index].cmds[j];
      }
    }
    
    // The max length of an fish's DNA string is 50
    // An fish's DNA string can only ever hold 50 nucleotides
    if (child.cmds.length > 50) 
    {
      child.cmds.length =  50;
    }
    
    updateAgent(child);
    
    // Adds the new fish to the population
    newpop[i] = child;
    index ++;
    if (index >= agents.length)
      {
        index = 0;
      }
  }
  // Updates the population
  agents = newpop;
}


/**
*  This function will spawn 1 fish
**/ 
function make_agent() 
{
  let a = 
  {
    // The DNA string of the fish
    cmds: create(size, lexiconAgent),
    
    // Gives the fish a position
    pos: new vec2(random(), random()),
    // Gives the fish a maximum speed
    vel: vec2.random(random() * max_speed),
    // Creates a variable to hold the fish's acceleration
    // This variable will be empty upon creation
    // The fish will have no acceleration upon creation
    // This will result in the agent having a fixed velocity at spawn
    acceleration: new vec2(),
    flockingFactor: 0,
    // Fish rgb color
    colour: [random(), random(), random()],
    // Sets the fish's size;
    // The fish will have a random size
    size: (random() + 1)/100,
    isEaten: false
  };
  updateAgent(a);
  agents.push(a);
  return a;
}


/**
*  This function will make 1 triangle for the squid's tentacle
**/
function make_tentacle(predator, minus, position, vel, hslValue)
{
  let t = 
  {
    // Gives the squid a position
    pos: position.clone(),
    vel: vel.clone(),
    // The size of the tentacles is determined by the genetics of the squid
    // The more "-" nucleotides a squid has the more/longer tentacles it will have
    size: 0.01 * minus,
    hsl: hslValue
  };
  predator.tentacleTrail.push(t);
  return t;
}


/**
*  This function will spawn 1 squid
**/ 
function make_predator() 
{
  let p = 
  {
    // The DNA string of the squid
    cmds: create(size, lexiconSquid),
    // The number of + nucleotides in the DNA string
    plus: 0,
    // The number of - nucleotides in the DNA string
    minus: 0,
    // Gives the squid a position
    pos: new vec2(random(), random()),
    // Gives the squid a maximum speed
    vel: vec2.random(random() * predator_max_speed),
    // Creates a variable to hold the squid's acceleration
    // This variable will be empty upon creation
    // The squid will have no acceleration upon creation
    // This will result in the squid having a fixed velocity at spawn
    acceleration: new vec2(),
    // Sets the squid's size;
    size: 0.01,
    // The current colour of the squid
    hslColour: random(),
    // The rate at which this squid changes colours
    // The more fish a squid eats, the faster it changes colours
    hslChange: 0,
    saturation: 0.5,
    lightness: 0,
    // The camoflauge of the squid is determined by its genetics
    camoflaugeRange: 0,
    isDead: false,
    // Metabolism deterines how often a squid needs to eat to sustain itself
    metabolism: 5,
    timer: 0,
    // The squid's tentacles
    tentacleTrail: [],
    tentacleTimer: 0.1
  };
  updatePredator(p);
  predators.push(p);
  return p;
}


/**
*  Updates the squid's parameters upon creation
**/
function updatePredator(p)
{
  // Counts the number of + and - nucleotides in the DNA string
  p.plus = countChar(p.cmds, "+");
  p.minus = countChar(p.cmds, "-");
  // The more "+" nucleotides in the DNA string, the faster the squid moves
  p.vel = vec2.random((p.plus/20.0) * predator_max_speed);
  // The more "+" nucleotides in the DNA string, the less camoflauge the squid has
  p.saturation += (p.plus * 5)/100.0;
  p.lightness += (p.plus * 5)/100.0;
  // The more "-" nucleotides in the DNA string, the larger the squid
  p.size += (0.01 * p.minus);
  // Adjusts the camoflauge of the squid to fit its size
  p.camoflaugeRange = 0.05 - ((p.plus/10.0) * p.size);
  // The more "-" nucleotides in the DNA string, the more the squid needs to eat to sustain itself
  p.metabolism -= p.minus * 0.1;
  // Creates the tentacles based on the squid's genetics
  for (let i = Math.ceil(p.minus * 1.5); i > 0; i --)
  {
    make_tentacle(p, p.minus, p.pos, p.vel, p.hslColour)
  }
}


/**
*  Updates the fish's parameters upon creation
**/
function updateAgent(p)
{
  // Counts the number of x and y nucleotides in the DNA string
  p.pink = countChar(p.cmds, "y");
  p.blue = countChar(p.cmds, "x");
  // The more x nucleotides in the DNA string, the more blue the agent is
  let colour;
  let sat;
  // Checks if the fish is more blue or pink
  // Checks if the fish is male or female
  if (p.pink > p.blue){
     colour = 330;
     sat = p.pink - p.blue;
  }
  else{
    colour = 240;
    sat = p.blue - p.pink;
  }
  // The more colourful a fish is the more likely it is to flock (this is not affected by gender)
  p.flockingFactor = (sat / 100);
  p.colour[0] = colour / 360;
  p.colour[1] = (sat + 2.5) / 10;
  p.colour[2] = 0.6;  
}


/**
*  This function moves the fish on the field by changing its position
*  @param  agent  a  The fish that will be moved
**/ 
function move_agent(a) 
{
    // Updates the fish's velocity
    // The fish's current velocity is equal to its previous velocity + acceleration
    a.vel.add(a.acceleration).limit(max_speed);
    // Wraps the fish's position on the field
    // If the fish's position goes off of the field the fish will appear on the other side of the field
    a.pos.add(a.vel).wrap(1);
}


/**
*  This function updates the values of the fish
*  @param  agent  a  The fish that will be updated
**/ 
function update_agent(a) 
{
  // Sets the desired velocity of the fish
  // The fish is initially a random walker
  // Clone the fish's current velocity
  let desired_velocity = a.vel.clone()
    // Slightly rotate the fish to make its movement seem more natural
    .rotate(random_walk_variance*(random()-0.5))
    // Slightly change the speed of the fish
    .setmag(max_speed * random());
  
  // Saves the direction of the fish
  let dir = a.vel.angle();
    
  // This variable will hold all of the fish's current neighbours
  let neighbours = 0;
  let predatoors = 0;
  // The variables that are used for the three steering forces
  let neighbour_locations = new vec2();
  let neighbour_velocities = new vec2();
  let neighbour_avoidances = new vec2();
    
  // Checks the fish
  for (let n of agents) 
  {
    // If the checked fish is the current fish then it is skipped
    if (n == a) continue;
        
    // Retrieves the relative position vector of the neighbouring fish
    // This vector is cloned so that the original n.pos value is not altered
    let rel = n.pos.clone().sub(a.pos);
    // Retrieve the shortest possible relative vector
    // Due to the spanning borders of the toroidal space, there can be more than one relative vector
    // The field size is 1 (hence "relativewrap(1))
    rel.relativewrap(1);  
    // The distance between fish is the distance between bodies not the distance between centers
    // To get the distance between bodies, we subtract the body size and the distance between fish
    let distance = Math.max(rel.len() - a.size - n.size, 0);
    // The neighbouring fish is in visible range if the distance between is less than the fish's range of view
    let in_visible_range = distance < (n.flockingFactor) + agent_range_of_view;
    // The relative view of the neighbouring fish is the local angle of the neighbour relative to the fish
    // The relative angle directly in front of the fish is 0
    let viewrel = rel.clone().rotate(-dir);
    // Remember if the neighbour is within the fish's field of view
    // Absolute value is used to capture the right and left angle
    let in_visible_angle = Math.abs(viewrel.angle()) < agent_field_of_view;   
    // When the neighbour is within range and field of view
    if (in_visible_range && in_visible_angle) 
    {
      // The current neighbour is added to the fish's list of neighbours
      neighbours++;
      // Accumulate relative locations
      // This will be used later for calculating the centering force
      neighbour_locations.add(rel);
      // Rotate the neighbours velocity into the fish's field of view
      let relative_velocity = n.vel.clone().rotate(-dir);
      // Accumulate the aligning force
      neighbour_velocities.add(n.vel);   
      // Determines if the fish and the neighbour are going to collide
      // Calculates the position of the collision
      let npos1 = n.pos.clone().add(n.vel);
      let apos1 = a.pos.clone().add(a.vel);
      let rel1 = npos1.sub(apos1);
      // Retrieve the shortest possible relative vector
      // Due to the spanning borders of the toroidal space, there can be more than one relative vector
      // The field size is 1 (hence "relativewrap(1))
      rel1.relativewrap(1);  
      // The distance between fish is the distance between bodies not the distance between centers
      // To get the distance between bodies, we subtract the body size and the distance between fish
      let distance1 = Math.max(rel1.len() - a.size - n.size, 0);
      // Feeling is used to determine the optimal distance
      // The optimal distance is used to determine the feeling
      // If the neighbours are too close then the fish will have a negative feeling
      let negative_feeling = Math.min(0, distance1 - agent_optimal_distance);
      // If the fish has a negative feeling, the fish will try to space itself away from its neighbours
      if (negative_feeling < 0) 
      {
        // Calculate the size of the normal between the fish and the neighbour
        let normalized = negative_feeling  / agent_optimal_distance;
        // Set the space between the fish and neighbour (to avoid) as the size of the normal
        neighbour_avoidances.add(rel1.clone().setmag(normalized));
      }
    }
  }
  
  // Each fish will also check for coral in addition to neighbours
  for (let p of obstacles) 
  {
    // Retrieves the relative position vector of the coral
    // This value is clones so that the original n.pos is not altered
    let rel = p.pos.clone().sub(a.pos);
    // Retrieve the shortest possible relative vector
    // Due to the spanning borders of the toroidal space, there can be more than one relative vector
    // The field size is 1 (hence "relativewrap(1))
    rel.relativewrap(1);  
    // The distance between fish and coral is the distance between bodies not the distance between centers
    // To get the distance between bodies, we subtract the body size and the distance between fish and coral
    let distance = Math.max(rel.len() - a.size - p.size, 0);
    // The coral is in visible range if the distance between is less than the fish's range of view
    let in_visible_range = distance < agent_range_of_view;    
    // The relative view of the coral is the local angle of the coral relative to the fish
    // The relative angle direclty in front of the fish is 0
    let viewrel = rel.clone().rotate(-dir);
    // Remember if the coral is within the fish's field of view
    // Absolute value is used to capture the right and left angle
    let in_visible_angle = Math.abs(viewrel.angle()) < agent_field_of_view;   
    // When the coral is within range and field of view
    if (in_visible_range && in_visible_angle) 
    {
      // Feeling is used to determine the optimal distance
      // The optimal distance is used to determine the feeling
      // If the coral is too close then the fish will have a negative feeling
      let negative_feeling = Math.min(0, distance - agent_optimal_distance);
      // If the fish has a negative feeling, the agent will try to space itself away from the coral
      if (negative_feeling < 0) 
      {
        // Calculate the size of the normal between the fish and the coral
        let normalized = negative_feeling  / agent_optimal_distance;
        // Set the space between the fish and coral (to avoid) as the size of the normal
        neighbour_avoidances.add(rel.clone().setmag(normalized));
      }
    }
  }
  
  // Each fish will also check for squids in addition to neighbouring fish and obstacles
  // Squids are treated as obstacles to avoid
  for (let p of predators) 
  {
    // Retrieves the relative position vector of the squid
    // This value is clones so that the original n.pos is not altered
    let rel = p.pos.clone().sub(a.pos);
    // Retrieve the shortest possible relative vector
    // Due to the spanning borders of the toroidal space, there can be more than one relative vector
    // The field size is 1 (hence "relativewrap(1))
    rel.relativewrap(1);  
    // The distance between fish and squid is the distance between bodies not the distance between centers
    // To get the distance between bodies, we subtract the body size and the distance between fish and squid
    let distance = Math.max(rel.len() - a.size/2 - p.size/2, 0);
    // When an fish and squid collide the fish is eaten
    // When an fish and squid collide the squid changes colours slightly faster
    // Reset the death timer to eat back to 0
    if (distance <= 0)
    {
      a.isEaten = true;
      p.hslChange += 0.001;
      p.timer = 0;
      if (p.hslChange > 0.1)
      {
        p.hslChange = 0.1;
      }
    }
    // The squid is in visible range if the distance between is less than the fish's range of view
    let in_visible_range = distance < (agent_range_of_view - p.camoflaugeRange);    
    // The relative view of the squid is the local angle of the squid relative to the fish
    // The relative angle direclty in front of the fish is 0
    let viewrel = rel.clone().rotate(-dir);
    // Remember if the squid is within the fish's field of view
    // Absolute value is used to capture the right and left angle
    let in_visible_angle = Math.abs(viewrel.angle()) < agent_field_of_view;   
    // When the squid is within range and field of view
    if (in_visible_range && in_visible_angle) 
    {
      // Keeps track of how many squids the fish currently sees
      predatoors ++;
      // Feeling is used to determine the optimal distance
      // The optimal distance is used to determine the feeling
      // If the squid is too close then the fish will have a negative feeling
      // The optimal distance for avoiding squids is larger than the optimal distance for avoiding squids and neighbours
      let negative_feeling = Math.min(0, distance - predator_optimal_distance);
      // If the fish has a negative feeling, the fish will try to space itself away from the squids
      if (negative_feeling < 0) 
      {
        // Calculate the size of the normal between the fish and the squid
        let normalized = negative_feeling  / predator_optimal_distance;
        // Set the space between the fish and squid (to avoid) as the size of the normal
        neighbour_avoidances.add(rel.clone().setmag(normalized));
      }
    }
  }
    
  // Remember the number of neighbours seen by the fish
  a.sees_neighbours = neighbours > 0;
  // Remember the number of squids seen by the fish
  a.sees_predators = predatoors > 0;
  // When the fish sees one or more neighbours
  if (a.sees_neighbours) 
  {
    // Calculate the average position between all neighbours
    // This value is calculated by dividing the total accumulated locations by the number of neighbours
    neighbour_locations.div(neighbours);
    // Calculate the average velocity between all neighbours
    // This value is calculated by dividing the total accumulated velocities by the number of neighbours
    neighbour_velocities.div(neighbours);    
    // Multiply the value by a centering factor
    neighbour_locations.mul(centering_factor);
    // Calculate the desired velocity
    // Avoidance is subtracted and treated as a repulsion
    desired_velocity
      .add(neighbour_locations)
      .add(neighbour_velocities);
  }
  
  // The fish will still try to avoid objects (such as squids and coral) even if it has no neighbours
  neighbour_avoidances.mul(avoidance_factor);
  desired_velocity.add(neighbour_avoidances);
  
  // The desired velocity is converted into a steering force
  // The current velocity is subtracted to get the fish's acceleration
  a.acceleration = desired_velocity.sub(a.vel);
  // Constraints are applied so that the fish cannot exceed the maximum velocity and acceleration
  a.acceleration.limit(max_force);
}


/**
*  This function moves the squid on the field by changing its position
*  @param  predator  a  The squid that will be moved
**/ 
function move_predator(a) 
{
    // Updates the squid's velocity
    // The squid's current velocity is equal to its previous velocity + acceleration
    a.vel.add(a.acceleration).limit(predator_max_speed);
    // Wraps the squid's position on the field
    // If the squid's position goes off of the field the squid will appear on the other side of the field
    a.pos.add(a.vel).wrap(1);
}


/**
*  This function updates the values of the squid
*  The squid is treated similar to an fish, as it will avoid coral like a fish
*  However the squid will ignore the position of other squid
*  Additionally the squid will chase/hunt down groups of fish instead of following them
*  @param  predator  a  The squid that will be updated
**/ 
function update_predator(a) 
{
  // Sets the desired velocity of the squid
  // The squid is initially a random walker
  // Clone the squid's current velocity
  let desired_velocity = a.vel.clone()
    // Slightly rotate the squid to make its movement seem more natural
    .rotate(random_walk_variance*(random()-0.5))
    // Slightly change the speed of the squid
    .setmag(predator_max_speed * random());
  
  // Saves the direction of the squid
  let dir = a.vel.angle();
  
  // This variable will hold all of the squid's current prey
  let prey = 0;
  // The variables that are used for the three steering forces
  let neighbour_locations = new vec2();
  let neighbour_velocities = new vec2();
  let neighbour_avoidances = new vec2();
    
  // Checks the fish
  for (let n of agents) 
  { 
    // Retrieves the relative position vector of the neighbouring fish
    // This vector is cloned so that the original n.pos value is not altered
    let rel = n.pos.clone().sub(a.pos);
    // Retrieve the shortest possible relative vector
    // Due to the spanning borders of the toroidal space, there can be more than one relative vector
    // The field size is 1 (hence "relativewrap(1))
    rel.relativewrap(1);  
    // The distance between squid and fish is the distance between bodies not the distance between centers
    // To get the distance between bodies, we subtract the body size and the distance between squid and fish
    let distance = Math.max(rel.len() - a.size - n.size, 0);
    // The neighbouring fish is in visible range if the distance between is less than the squid's range of view
    let in_visible_range = distance < n.flockingFactor + predator_range_of_view;
    // The relative view of the neighbouring fish is the local angle of the neighbour relative to the fish
    // The relative angle directly in front of the squid is 0
    let viewrel = rel.clone().rotate(-dir);
    // Remember if the neighbour is within the squid's field of view
    // Absolute value is used to capture the right and left angle
    let in_visible_angle = Math.abs(viewrel.angle()) < predator_field_of_view;   
    // When the neighbour is within range and field of view
    if (in_visible_range && in_visible_angle) 
    {
      // The current prey is added to the squid's list of prey
      prey ++;
      // Accumulate relative locations
      // This will be used later for calculating the centering force
      neighbour_locations.add(rel);
      // Rotate the neighbours velocity into the squid's field of view
      let relative_velocity = n.vel.clone().rotate(-dir);
      // Accumulate the aligning force
      neighbour_velocities.add(n.vel);   
      // Determines if the squid and the neighbour are going to collide
      // Calculates the position of the collision
      let npos1 = n.pos.clone().add(n.vel);
      let apos1 = a.pos.clone().add(a.vel);
      let rel1 = npos1.sub(apos1);
      // Retrieve the shortest possible relative vector
      // Due to the spanning borders of the toroidal space, there can be more than one relative vector
      // The field size is 1 (hence "relativewrap(1))
      rel1.relativewrap(1);  
      // The distance between squid and fish is the distance between bodies not the distance between centers
      // To get the distance between bodies, we subtract the body size and the distance between squid and fish
      let distance1 = Math.max(rel1.len() - a.size - n.size, 0);
      // Feeling is used to determine the optimal distance
      // The optimal distance is used to determine the feeling
      // If the neighbouring fish are too close, then the squid will have a positive feeling
      let positive_feeling = Math.min(0, distance1 - predator_optimal_distance);
      // When the squid has a positive feeling, the squid will try to move closer to the neighbouring fish
      if (positive_feeling < 0) 
      {
        // Calculate the size of the normal between the squid and the neighbour
        let normalized = positive_feeling  / predator_optimal_distance;
        // Set the space between the squid and neighbour (to chase) as the size of the normal
        neighbour_avoidances.sub(rel1.clone().setmag(normalized));
      }
    }
  }
  
  // Each squid will also check for coral in addition to neighbours
  for (let p of obstacles) 
  {
    // Retrieves the relative position vector of the coral
    // This value is clones so that the original n.pos is not altered
    let rel = p.pos.clone().sub(a.pos);
    // Retrieve the shortest possible relative vector
    // Due to the spanning borders of the toroidal space, there can be more than one relative vector
    // The field size is 1 (hence "relativewrap(1))
    rel.relativewrap(1);  
    // The distance between squid and coral is the distance between bodies not the distance between centers
    // To get the distance between bodies, we subtract the body size and the distance between squid and coral
    let distance = Math.max(rel.len() - a.size - p.size, 0);
    // The obstacle is in visible range if the distance between is less than the squid's range of view
    let in_visible_range = distance < predator_range_of_view;    
    // The relative view of the coral is the local angle of the coral relative to the squid
    // The relative angle direclty in front of the squid is 0
    let viewrel = rel.clone().rotate(-dir);
    // Remember if the coral is within the squid's field of view
    // Absolute value is used to capture the right and left angle
    let in_visible_angle = Math.abs(viewrel.angle()) < predator_field_of_view;   
    // When the coral is within range and field of view
    if (in_visible_range && in_visible_angle) 
    {
      // Feeling is used to determine the optimal distance
      // The optimal distance is used to determine the feeling
      // If the obstacle is too close then the squid will have a negative feeling
      let negative_feeling = Math.min(0, distance - predator_optimal_distance);
      // If the squid has a negative feeling, the squid will try to space itself away from the coral
      if (negative_feeling < 0) 
      {
        // Calculate the size of the normal between the squid and the coral
        let normalized = negative_feeling  / predator_optimal_distance;
        // Set the space between the squid and coral (to avoid) as the size of the normal
        neighbour_avoidances.add(rel.clone().setmag(normalized));
      }
    }
  }
    
  // Each squid will also check for squid in addition to fish and coral
  // Squids are treated as obstacles to avoid
  // While the squids are not hunting one another, they still need to avoid colliding with one another
  for (let p of predators) 
  {
    // Retrieves the relative position vector of the coral
    // This value is clones so that the original n.pos is not altered
    let rel = p.pos.clone().sub(a.pos);
    // Retrieve the shortest possible relative vector
    // Due to the spanning borders of the toroidal space, there can be more than one relative vector
    // The field size is 1 (hence "relativewrap(1))
    rel.relativewrap(1);  
    // The distance between squids is the distance between bodies not the distance between centers
    // To get the distance between bodies, we subtract the body size and the distance between squids
    let distance = Math.max(rel.len() - a.size - p.size, 0);
    // The squid is in visible range if the distance between is less than the squid's range of view
    let in_visible_range = distance < predator_range_of_view;    
    // The relative view of the squid is the local angle of the neighbouring squid relative to the squid
    // The relative angle direclty in front of the squid is 0
    let viewrel = rel.clone().rotate(-dir);
    // Remember if the neighbour is within the squid's field of view
    // Absolute value is used to capture the right and left angle
    let in_visible_angle = Math.abs(viewrel.angle()) < predator_field_of_view;   
    // When the neighbour is within range and field of view
    if (in_visible_range && in_visible_angle) 
    {
      // Feeling is used to determine the optimal distance
      // The optimal distance is used to determine the feeling
      // If the neighbouring squid is too close then the squid will have a negative feeling
      let negative_feeling = Math.min(0, distance - predator_optimal_distance);
      // If the squid has a negative feeling, the squid will try to space itself away from the neighbouring squid
      if (negative_feeling < 0) 
      {
        // Calculate the size of the normal between the squid and the neighbour
        let normalized = negative_feeling  / predator_optimal_distance;
        // Set the space between the squid and neighbour (to avoid) as the size of the normal
        neighbour_avoidances.add(rel.clone().setmag(normalized));
      }
    }
  }
  
  // Remember the number of neighbours seen by the squid
  a.sees_neighbours = prey > 0;
  // Remember the number of prey seen by the squid
  a.sees_prey = prey > 0;
  // When the squid sees one or more neighbours
  if (a.sees_neighbours) 
  {
    // Calculate the average position between all neighbours
    // This value is calculated by dividing the total accumulated locations by the number of neighbours
    neighbour_locations.div(prey);
    // Calculate the average velocity between all neighbours
    // This value is calculated by dividing the total accumulated velocities by the number of neighbours
    neighbour_velocities.div(prey);    
    // Multiply the value by a centering factor
    neighbour_locations.mul(centering_factor);
    // Calculate the desired velocity
    // Avoidance is subtracted and treated as a repulsion
    desired_velocity
      .add(neighbour_locations)
      .add(neighbour_velocities);
  }
  
  // The squid will still try to avoid objects (such as fish and coral) even if it has no neighbours
  neighbour_avoidances.mul(avoidance_factor);
  desired_velocity.add(neighbour_avoidances);
  
  // The desired velocity is converted into a steering force
  // The current velocity is subtracted to get the squid's acceleration
  a.acceleration = desired_velocity.sub(a.vel);
  // Constraints are applied so that the squid cannot exceed the maximum velocity and acceleration
  a.acceleration.limit(predator_max_force);
}


/**
*  This function is called inbetween every frame before the draw
*  This is used to update the logic/variables of the code
**/ 
function update(dt) 
{
  ModifyEnvironment();
  // Updates all of the fish
  for (let a of agents) 
  {
    // Updates all of the fish's values
    update_agent(a);
    // Moves all of the fish
    // Updates the position, velocity, and acceleration of the fish
    move_agent(a);
  }
  
  // Updates all of the squids
  for (let a of predators)
  {
    // Updates all of the squids's values
    update_predator(a);
    // Moves all of the squids
    // Updates the position, velocity, and acceleration of the squids
    move_predator(a);
    a.timer += dt;
    if (a.timer > a.metabolism)
    {
      a.isDead = true;
    }
  }
  // Deletes the fish if it is eaten
  for (let i = agents.length - 1; i >= 0; i --)
  {
    if (agents[i].isEaten)
    {
      let old = agents.splice(i, 1);
      delete old;
    }
  }
  // Deletes the squids if it is starved to death
  for (let i = predators.length - 1; i >= 0; i --)
  {
    if (predators[i].isDead)
    {
      let old = predators.splice(i, 1);
      delete old;
    }
  }
  // Updates the tentacle timers
  generationTimer += dt;
  
  // Updates all of the squid's tentacles
  for (let p of predators)
  {
    p.tentacleTimer += dt;
      if (p.tentacleTimer > 0.04 * p.minus)
      {
        make_tentacle(p, p.minus, p.pos, p.vel, p.hslColour)
        // If the length of the trail is greater than the size of the squid, 
        // Then remove old data by splicing
        if (p.tentacleTrail.length > p.minus)
        {
          // Leave a food trail behind the bug and its amount is based on size of squid
          p.tentacleTrail = p.tentacleTrail.slice(1);
        }
        p.tentacleTimer = 0;
      }
  }
  
  // Creates the next generation every few seconds
  if (generationTimer > generationTimeGoal && predators.length > 0)
    {
      // Clears the list of coral
      obstacles.length = 0;
      // Creates the next generation of squid
      regeneratePredators();
      // Creates the next generation of fish
      regeneratePrey();
    }
  
  // Clears the list of coral
  obstacles.length = 0;
  // SetCells makes the grid (and deals with the rules for the black vs white)
  SetCells();
  // make grid smooth or not
  grid.smooth = isSmooth;
  
  // this finds if the grid has become only 1 color, and if so makes explosions of the opposite color (so there is always a space for the other team)
  let gridHighestVal = grid.max();
  gridLowestVal = grid.min();
  // if space is all red coral
  if (gridLowestVal == 1) {
    grid.set(function () {
      return [0, 0, 0];
    });
  }
  // if space is all black, i.e. no coral
  else if (gridHighestVal == 0) {
    changeSpaceOwner(1, random(dim), random(dim), true);
  }  
  
}


/**
*  This function is called between every frame after the update function
*  This is used to update the graphics of the code
**/ 
function draw() 
{
  // draw the grid with the corals (red outline)
  //grid.draw();
  
  // Sets the colour of the obstacle to grey-blue
  draw2D.color(1, 0, 0);
  // Draws each of the coral (obstacles)
  for (let p of obstacles)
    draw2D.rect(p.pos, p.size);
  // Draws each of the agents
  for (let a of agents) 
  {
    // Pushes the agent's local position
    draw2D.push().translate(a.pos).rotate(a.vel).scale(a.size);
    // Agents that see a predator will turn white
    draw2D.hsl(a.colour[0], a.colour[1], a.colour[2]);
    // The agent is the shape of a triangle
    draw2D.triangle(1, 0.5);
    // Finish drawing the agent (pop)
    draw2D.pop();    
  }
  // Draws each of the predators
  for (let o of predators) 
  { 
    for (let i =  o.tentacleTrail.length - 1; i >= 0; i --)
    {
      let t = o.tentacleTrail[i]
      draw2D.push().translate(t.pos).rotate(t.vel).scale(t.size);
      draw2D.hsl(t.hsl, o.saturation, o.lightness);
      let scaleFactor = ((i)/o.tentacleTrail.length);
      draw2D.triangle(1 * scaleFactor,1 * scaleFactor);
      draw2D.pop();
    }
    // Pushes the predator's local position
    draw2D.push().translate(o.pos).rotate(o.vel).scale(o.size);
    // Updates the predator's colour
    o.hslColour += o.hslChange;
    // Wrap the predators hsl value back to 0 if it exceed 1
    if (o.hslColour > 1)
        o.hslColour = 0;
    // Sets the draw colour to the predator's colour
    // The predator will flash bright colours when chasing agents
    draw2D.hsl(o.hslColour, o.saturation, o.lightness);
    // The predator is a triangle
    draw2D.triangle(1, 1);
    // Done drawing the predator (pop)
    draw2D.pop();  
  }
 
}


/**
*  This is the reset function
*  This function is called evertime the enter key is pressed
*  This function is called when the page first loads
**/
function reset() 
{
  // Clears the agents list
  agents.length = 0;
  // Clears the obstacles list
  obstacles.length = 0;
  // Clears the predators
  predators.length = 0;
  
  /**
  *  Spawns 100 agents
  *  The agents that will be flocking together and avoiding obstacles
  **/ 
  for (let i=0; i<100; i++) 
    make_agent();

  /**
  *  Spawns 5 obstacles
  *  The stagnant obstacles on the map for the agents to avoid
  **/ 
  // for (let i=0; i<5; i++)
  //   make_obstacle();
  
  /**
  *  Spawns 5 predators
  *  The wandering predators on the map for the agents to avoid
  **/ 
  for (let i=0; i<5; i++)
  {
     make_predator(); 
  }
  
  // remove all coral
  grid.set(function () {
    return [0,0,0];
  });

  // make grid smooth or not
  grid.smooth = isSmooth;
}





/*
This creates the coral. Depending on conditions the grid's value
is changed at center = [xCord, yCord]. At that coordinate a square with
a radius of dim * the coral size will change the grid to either black or red
depending on the isCoral var.
Parameters:
-isCoral tells which side its on. If it is 1, then red, otherwise back => remove coral.
-xCord gives the x co-ordinate for the coral
-yCord gives the y co-ordinate for the coral
-isTooBig tells whether to make this coral big or small. If true then big, else small.
*/
function changeSpaceOwner(isCoral, xCord, yCord, isTooBig) {
  // this is the default radius of the new coral
  let coralSize = 0.08;
  if (isTooBig == true) {
    // this will make the coral bigger
    coralSize = 0.2;
  }
  // cover a square with xCord,yCord as the center and dim * the coral size
  for (let i = xCord - dim * coralSize; i < xCord + dim * coralSize; i++) {
    for (let j = yCord - dim * coralSize; j < yCord + dim * coralSize; j++) {
      if (isCoral == 0) {
        // if isCoral is 0 (false), then remove any coral in this area
        grid.set([0, 0, 0], i, j);
      } else {
        // else, we make the coral
        grid.set([1, 0, 0], i, j);
      }
    }
  }
}




/*
This is a function that is called to randomly make/modify the coral
in the environment,
*/
function spawnCoralTimer(team, explosionSize){
  for (let i = 0; i < 2; i++){
      changeSpaceOwner(team, random(dim), random(dim), explosionSize);
  }
}

/*
This is a function that is called every 3 seconds to either add a coral,
or modify/erase one.
*/
function ModifyEnvironment(team){
  
  if (now < environmentTimer){
    return;
  }
  
  if (random(10) > 6){
    spawnCoralTimer(0, true);
  }
  else {
    spawnCoralTimer(1, false);
  }
  environmentTimer = now + 3;
}


/*
This creates the grid and applies the logic for whether a space is black or red.
*/
function SetCells() {
  gridnext.set(function (x, y) {
    // get the color of all neighbors
    let C = grid.get(x, y);
    let N2 = grid.get(x, y - 1);
    let NE2 = grid.get(x + 1, y - 1);
    let E2 = grid.get(x + 1, y);
    let SE2 = grid.get(x + 1, y + 1);
    let S2 = grid.get(x, y + 1);
    let SW2 = grid.get(x - 1, y + 1);
    let W2 = grid.get(x - 1, y);
    let NW2 = grid.get(x - 1, y - 1);

    // calculate how much is red vs black (coral vs free space)
    let totalR = N2 + NE2 + E2 + SE2 + S2 + SW2 + W2 + NW2;
    let totalB = 8 - totalR;

    // if this cell is red
    if (C == 1) {
      // if there are at least 5 white cells near this
      if (totalR > coralGrowth[0]) { // 6 grow, 7 shrink
        // this cell has backup, it is strong enough to survive, remain white
        return [1, 0, 0];
      }
      // if there are less than 2 white cells
      else if (totalR < coralGrowth[1]) { // 3 grow, 4 shrink
        // this cell has no backup, it has to switch sides to survive, become black
        return [0, 0, 0];
      }
    }
    // if this cell is black
    else if (C == 0) {
      // if there are at least 5 black cells near this
      if (totalB > coralLoss[0]) { //4 grow, 4 shrink 
        // this cell has backup, it is strong enough to survive, remain black
        return [0, 0, 0];
      }
      // if there are less than 2 black cells
      else if (totalB < coralLoss[1]) { // 2 grow, 4 shrink
        // this cell has no backup, it has to switch sides to survive, become white
        return [1, 0, 0];
      }
    }

    // this counts as blue owned space
    spawnObstacle(x, y);
    return [1, 0, 1];
  });

  // transfer this grid to gridnext, and prepare this grid for the next round
  let temp = grid;
  grid = gridnext;
  gridnext = temp;
}


/*
called when any key events happen
Parameters:
-kind is the event type (down, up, etc.)
-key is the key (or keycode) pressed/released

This is for some interactions with the user using the keyboard
*/
function key(kind, key) {
  // choose random point on grid
  let loc = random(dim);
  // Press Key W- makes random grid space become white
  if (kind == "down" && key == "c") {
    // call 'explosion' function with 1 (white) as the space to be created
    changeSpaceOwner(1, loc, loc, true);
  }

  // Press Key F- makes simulation go faster
  if (kind == "down" && key == "f") {
    // call update more often
    update();
  }
}

function spawnObstacle(xPos, yPos)
{
  let p = 
  {
    // Sets the obstacle's position
    pos: new vec2(xPos/dim, yPos/dim),
    // Sets the obstacle's size
    size: 1/dim,
  };
  obstacles.push(p);
  return p;
}

/**
*  Reset function is fucked up the ass
*  variable "dt" is giving absurdly large values upon reset
**/
