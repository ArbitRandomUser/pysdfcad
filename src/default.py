#objects positioned from top left moving right
pos = 2.5 #some variable to space the objects

#middle row
# positioning rounding and scaling...
o1 = Box().scale(0.5).rounding(0.1).move(0,0,pos) 
#subtractions, (3 cylinders removed from a box)
o2 =  SmoothSubtract(Box(),
                     Union(Cylinder(h=2).rotx(PI/2),
                           Cylinder(h=2).roty(PI/2),
                           Cylinder(h=2).rotz(PI/2)).scale(0.8)
                     ).scale(0.8) 
o3 = Octahedron().scale(0.8).rounding().move(0,0.5,-pos)

#back row
o4 = Cone().rounding().scale(0.8).rotx(PI).move(-pos,1,pos) 
#intersection (smoothened intersection of a sphere
#               and triangular prism)
o5 = SmoothIntersect(Sphere().move(0,0.5,0),
                     TriPrism()
                     ).scale(0.8).move(-pos,0,-pos)
# smooth unions (smoothened union of a cylinder and a hexprism)
o6 = SmoothUnion(Cylinder(h=1.1),
                 HexPrism().scale(0.9).rounding()
                 ).scale(0.5).move(-pos,0,0) 

#front row
# Not true SDFs, the current oct-tree based mesh generation
# from marching-cubes-fast requires accurate sdf's
# for good mesh generation. Should change this to regular
# marching cubes at higher resolution.

#surface displacement ("bubbles" on a sphere)
o7 = Displace(Sphere().move(pos,0,pos),
              '0.05*sin(20.0*p.x)*sin(20.0*p.y)*sin(20.0*p.z)')
#twist (a twisted torus)
o8 = Torus(t=0.1).twist(0.5).move(pos,0,0)
#bend (a bent slab)
o9 = Box([1,0.1,0.5]).bend(0.1).move(pos,0.5,-pos)


#add all objects to the scene
addobject(o1,o2,o3,o4,o5,o6,o7,o8,o9)
