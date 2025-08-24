import inspect
import json
import math
import numpy as np

PI = math.pi
varno=1

__all_objects__ = [] #objects are added to this list

def glslfloat(m,d=10): ##CHANGE d to 10 , its 2 for DEBUG only !!!
    return f"{m:.{d}f}"

def Rotx(angle_rad):
    """ Creates a 4x4 rotation matrix for the X-axis. """
    c = np.cos(angle_rad)
    s = np.sin(angle_rad)
    
    # Returns a 4x4 matrix
    return np.array([
        [1,  0,  0,  0],
        [0,  c, -s,  0],
        [0,  s,  c,  0],
        [0,  0,  0,  1]
    ], dtype=np.float32)

def Roty(angle_rad):
    """ Creates a 4x4 rotation matrix for the Y-axis. """
    c = np.cos(angle_rad)
    s = np.sin(angle_rad)
    
    # Returns a 4x4 matrix
    return np.array([
        [c,  0,  s,  0],
        [0,  1,  0,  0],
        [-s, 0,  c,  0],
        [0,  0,  0,  1]
    ], dtype=np.float32)

def Rotz(angle_rad):
    """ Creates a 4x4 rotation matrix for the Z-axis. """
    c = np.cos(angle_rad)
    s = np.sin(angle_rad)
    
    # Returns a 4x4 matrix
    return np.array([
        [c, -s,  0,  0],
        [s,  c,  0,  0],
        [0,  0,  1,  0],
        [0,  0,  0,  1]
    ], dtype=np.float32)

def Translation(x=0, y=0, z=0):
    """ Creates a 4x4 translation matrix. """
    return np.array([
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0,  1]
    ], dtype=np.float32)

def genvar():
    global varno 
    varno+=1
    return "var_"+str(varno)

def genvar():
    global varno
    varno+=1
    return "var"+str(varno)

def indentglsl(code,lvl=1):
    ind = "    "*lvl
    #return ind+code.replace("\n",f"\n{ind}")
    return "".join(f"{ind}{c}\n" for c in code.rstrip().split("\n"))

def addobject(obj):
    __all_objects__.append(obj);

class SObject:
    def __init__(self):
        self.codeline = inspect.getouterframes(inspect.currentframe())[1].lineno
        self.coord = "pcoord"
    def makejson(self):
        return json.dumps(self.__dict__)
    def move(self,x,y,z):
        return Position(self,translation(x,y,z))
    def rotx(self,theta):
        return Position(self,rotx(theta))
    def roty(self,theta):
        return Position(self,roty(theta))
    def rotz(self,theta):
        return Position(self,rotz(theta))
    def pos(self,LT):
        """
        `obj.pos(LT)`
        apply linear transformation matrix LT, 
        LT is 4x4 matrix , you can use Rotx, Roty and Rotz etc 
        """
        return Position(self,LT)


O=[0.0,0.0,0.0]


## primitives
class Sphere(SObject):
    """
        ```
            Sphere(radius=1.0,pos=O)
        ```
        generate Sphere, default position at origin
    """
    def __init__(self,radius=1.0,pos=O):
        super().__init__()
        #print("running sphere")
        super().__init__()
        self.pos =pos 
        self.radius= radius
    def gen_glsl(self,pcoord,target_var):
        c = ", ".join( glslfloat(a) for a in self.pos)
        r = glslfloat(self.radius) 
        code = f"{target_var} = sphere({pcoord}, vec3({c}), {r})"
        return code

class RoundBox(SObject):
    """
        ```
        RoundBox(dims=[1,1,1],r=0.1)
        ```
        generate rounded box, default position at origin
        `r` is rounding factor
        `dims` 3 element list or tuple for dimensions along x,y and z
    """
    def __init__(self,dims=[1.0,1.0,1.0],r=0.1):
        super().__init__()
        self.dims = dims
        self.r = r
    def gen_glsl(self,pcoord,target_var):
        dims = ", ".join(glslfloat(a) for a in self.dims)
        r = glslfloat(self.r)
        code = f"{target_var} = roundbox({pcoord},vec3({dims}),{r})"
        return code

class Box(SObject):
    """
        ```
        Box(dims=[1.0,1.0,1.0])
        ```
        Make a box of size `dims` (3 element list/tuple)
    """
    def __init__(self,dims=[1,1,1]):
        super().__init__()
        self.dims=dims
    def gen_glsl(self,pcoord,target_var):
        dims = ", ".join(glslfloat(a) for a in self.dims)
        code = f"{target_var} = box({pcoord},vec3({dims}))"
        return code


class Torus(SObject):
    """
        ```
        Torus(r=1,t=0.5)
        ```
        t2 is a 2 element array of (inner radius, thickness) 
        thickness expands around the radius on both sides
    """
    def __init__(self,r1=1.0,t=0.5):
        super().__init__()
        self.t = (r1,t)
    def gen_glsl(self,p,tr):
        t = ", ".join(glslfloat(a) for a in self.t)
        code = f"{tr} = torus({p},vec2({t}))"
        return code

class CappedTorus(SObject):
    """
        ```
        CappedTorus(theta=PI/3,ra=1.0,t=0.3)
        theta: angle end points of cappings make with the center of torus
        ra: inner radius
        t: thickness
        ```
    """
    def __init__(self,theta=PI/3,ra=1.0,t=0.3):
        super().__init__()
        self.theta = theta 
        self.ra = ra
        self.t = t 
    def gen_glsl(self,p,tr):
        sc = ", ".join(glslfloat(a) for a in [math.sin(self.theta/2),math.cos(self.theta/2)])
        ra = glslfloat(self.ra)
        t = glslfloat(self.t)
        code = f"{tr} = cappedtorus({p}, vec2({sc}) ,{ra} , {t})"
        return code

class Link(SObject):
    """
        ```
        Link(le,r1,t)
        ```
        le : length of link
        r1 : radius at ends
        t  : thickens of link
    """
    def __init__(self,le,r1,t): #yes i know dataclasses exist.
        super().__init__()
        self.le = le 
        self.r1 = r1
        self.t = t 
    def gen_glsl(self,p,tr):
        le = glslfloat(self.le)
        r1 = glslfloat(self.r1)
        t = glslfloat(self.t)
        code = f"{tr} = link({p}, {le},{r1},{t})"
        return code

class InfCylinder(SObject):
    """
        ```
        Cylinder(r=1,x=0,y=0)
        ```
        infinite cylinder along Z 
        r: radius
        x,y : position
    """
    def __init__(self,r=1,x=0,y=0):
        super().__init__()
        self.c = [x,y,r] 
    def gen_glsl(self,p,tr):
        c = ", ".join(glslfloat(a) for a in self.c)
        code = f"{tr} = infcylinder({p},vec3({c}))"
        return code

class Cone(SObject):
    """
    ```
    Cone(r=1.0,z=1.0)
    ``` 
    cone tip at origin, r is the radius of the base, z is the height
    """
    def __init__(self,r=1.0,z=1.0):
        super().__init__()
        self.r = r 
        self.z = z
    def gen_glsl(self,p,tr):
        q = (self.r,self.z)
        q = ", ".join(glslfloat(a) for a in q)
        code = f"{tr} = cone({p},vec2({q}))"
        return code

class CappedCone(SObject):
    """
    ```
    CappedCone(h=1.0,r1=1.0,r2=0.5)
    ```
    capped cone with height `h`, base radius `r1` and top radius  `r2`
    """
    def __init__(self,h=1.0,r1=1.0,r2=0.5):
        super().__init__()
        self.h = h
        self.r1 = r1 
        self.r2 = r2
    def gen_glsl(self,p,tr):
        h = glslfloat(self.h)
        r1 = glslfloat(self.r1)
        r2 = glslfloat(self.r2)
        code = f"{tr} = cappedcone({p},{h},{r1},{r2})"
        return code

class SolidAngle(SObject):
    """
    ```
    SolidAngle(theta=PI/4,r=1.0)
    ```
    A solid angle or a 'sector' of a sphere(of radius `r`) with angle `theta`
    angle is from center to edge.
    think sector of angle `theta` revolved around an edge
    """
    def __init__(self,theta=PI/4,r=1.0):
        self.theta=theta
        self.r=r

    def gen_glsl(self,p,tr):
        c = ", ".join(glslfloat(a) for a in [math.sin(self.theta),math.cos(self.theta)])
        r = glslfloat(self.r)
        code = f"{tr} = solidangle({p},vec2({c}),{r})"
        return code

class InfCone(SObject):
    """
    ```
    InfCone(theta)
    ``` 
    infinite cone with tip at origin, theta is the angle of the cone 
    """
    def __init__(self,theta):
        super().__init__()
        self.q = (math.sin(theta),math.cos(theta)) 
    def gen_glsl(self,p,tr):
        q = ", ".join(glslfloat(a) for a in self.q)
        code = f"{tr} = infcone({p},vec2({q}))"
        return code

class Plane(SObject):
    """
    ```
        Plane(n=[0.0,0.0,1.0],h=0.0)
    ```
        Plane , n is the normal, h is the distance from origin
    """
    def __init__(self,n=[0,0,1],h=0.0):
        super().__init__()
        self.n = n
        self.h = h
    def gen_glsl(self,p,tr):
        n = self.n/np.linalg.norm(n)
        n = ", ".join(glslfloat(a) for a in n)
        h = glslfloat(self.h)
        code = f"{tr} = plane({p},vec3({n}),{h})"
        return code

class Octahedron(SObject):
    """
    ```
        Octahedron(s=1.0)
    ```
        Octahedron with base of side s
    """
    def __init__(self,s=1.0):
        self.s = s
    def gen_glsl(self,p,tr):
        s = glslfloat(self.s)
        code = f"{tr} = octahedron({p},{s})"
        return code

class HexPrism(SObject):
    """
    ```
    HexPrism(r=1.0,t=1.0)
    ```
    Hex prism of "radius" r and thickness t
    """
    def __init__(self,r=1.0,t=1.0):
        super().__init__()
        self.h=h
        self.t=t
    def gen_glsl(self,p,tr):
        ht = [self.h,self.t]
        ht = ", ".join(glslfloat(a) for a in ht)
        code = f"{tr} = hexprism({p},vec2({h}))"
        return code
       
class TriPrism(SObject):
    """
    ```
        TriPrism(r=1.0,h=1.0)
    ```
    Triangular prism.
    """
    def __init__(self,r=1.0,h=1.0):
        super().__init__()
        self.r = r
        self.h = h
    def gen_glsl(self,p,tr):
        rh = [self.r,self.h]
        rh = ", ".join(glslfloat(a) for a in rh)
        code = f"{tr} = triprism({p},vec2({rh}))"
        return code

class Capsule(SObject):
    """
    ```
    Capsule(st=O,en=(0,0,1),r=0.1))
    ```
    Capsule , starting at `st`, ending at `en` with radius `r`
    """
    def __init__(self,a=O,b=(0,0,1),r=0.1):
        super().__init__()
        self.a=a
        self.b=b
        self.r=r
    def gen_glsl(self,p,tr):
        a = ", ".join(glslfloat(i) for i in self.a)
        b = ", ".join(glslfloat(i) for i in self.b)
        r = glslfloat(self.r)
        code = f"{tr} = capsule({p}, vec3({a}), vec3({b}), {r})"
        return code

class Cylinder(SObject):
    """
    ```
    Cylinder(h=1.0,r=1.0)
    ```
    Cylinder with height `h` and radius `r`
    """
    def __init__(self,h=1.0,r=1.0):
        self.h=h
        self.r=r
    def gen_glsl(self,p,tr):
        h = glslfloat(self.h)
        r = glslfloat(self.r)
        code = f"{tr} = cylinder({p},{h},{r})"
        return code


class Elongate(SObject):
    """
    elongate the object. Think of it as introducing a "slice"  of the object at the origin
    and the elongating this slice.
    `h` is a vector3 of how much you want to elongate along each dimension 
    ```
        Elongate(SObject,h:vec3)
    ```
    """
    #todo other implementation from ig's page
    def __init__(self,sobject,h):
        #print("running Elongate")
        super().__init__()
        self.child = sobject
        self.h = h;
        #coordtransform = f"""vec3 {newcoord} = {oldcoord} - clamp({oldcoord},-{hh},{hh});"""
    def gen_glsl(self,pcoord,target_var):
        hh = f"vec3({self.h[0]}, {self.h[1]}, {self.h[2]})"
        newcoord = "p"+genvar()
        code = "".join(["{//Elongate\n",
                        indentglsl(f"vec3 {newcoord} = {pcoord} - clamp({pcoord},-{hh},{hh});\n"),
                        indentglsl(f"{self.child.gen_glsl(newcoord,target_var)};\n"),
                        "}"])
        return code

class Rounding(SObject):
    """
    ```
        Rounding(SObject,r=0.1)
    ```
    round an object along its sharp edges with rounding radius `r`
    """
    def __init__(self,obj,r=0.1):
        self.child = obj
        self.r = r
    def gen_glsl(self,p,tr):
        r = glslfloat(self.r)
        code = "{//Rounding\n"
        code += indentglsl(f"{self.child.gen_glsl(p,tr)};\n")
        code += indentglsl(f"{tr} = {tr}-{r};\n")
        code += "}"
        return code


class Displace(SObject):
    def __init__(self,obj,func):
        super().__init__()
        self.child = obj
        self.func=func
    def gen_glsl(self,p,tr):
        code = "{//Displacement\n"
        tvar1 = f"p_{genvar()}"
        tvar2 = f"p_{genvar()}"

        code += f"float {tvar1};\n"
        code += f"float {tvar2};\n"
        code += indentglsl(f"{self.child.gen_glsl(p,tvar1)};\n")
        code += indentglsl(f"{tvar2} = {self.func.replace('p',p)};\n")
        code += f"{tr} = {tvar1}+{tvar2};\n"
        code +="}"
        return code


class Union(SObject):
    """
        ```
        Union(*objlist,sm=False,k=0.1)
        ```
        creates a union of objects , `sm` sets if its a smooth union or not,
        `k` is the smoothing factor when `sm=True`
        example
        ```
        A = Sphere(1.0)
        B = RoundBox((1.0,1.0,2.0),0.1)
        C = <somthing else> 
        Union(A,B,C)
    """
    def __init__(self,*objlist,sm=False,k=0.1):
        #print("running union")
        super().__init__()
        self.children = objlist
        self.sm = sm 
        self.k=k
    def gen_glsl(self,pcoord,target_var):
        k = glslfloat(self.k)
        code = "{//Union\n"
        if not self.children:
            return indentglsl(f"{target_var} = 1e9;")
        code+= indentglsl(f"{self.children[0].gen_glsl(pcoord,target_var)};\n")
        tempvar = genvar() 
        if len(self.children)>1:
            code += indentglsl(f"float {tempvar};\n")
            for child in self.children[1:]:
                code+=indentglsl(f"{child.gen_glsl(pcoord,tempvar)};\n")
                if self.sm:
                    code+=indentglsl(f"{target_var} = smin({target_var}, {tempvar}, {k});\n")
                else:
                    code+=indentglsl(f"{target_var} = min({target_var}, {tempvar});\n")
        code+="}"
        return code

class SmoothUnion(Union):
    """
        ```
        SmoothUnion(*objlist,k=0.1)
        ```
        generates a smoothed union with smoothing factor k
    """
    def __init__(self,*objlist,k=0.1):
        super().__init__(*objlist,sm=True,k=k)

class Intersect(SObject):
    """
    """
    def __init__(self,*objlist,sm=False,k=0.1):
        super().__init__()
        self.children=objlist
        self.sm=sm
        self.k=k

    def gen_glsl(self,pcoord,target_var):
        k = glslfloat(self.k)
        code = "{//Union\n"
        if not self.children:
            return indentglsl(f"{target_var} = 1e9;")
        code+= indentglsl(f"{self.children[0].gen_glsl(pcoord,target_var)};\n")
        tempvar = genvar() 
        if len(self.children)>1:
            code += indentglsl(f"float {tempvar};\n")
            for child in self.children[1:]:
                code+=indentglsl(f"{child.gen_glsl(pcoord,tempvar)};\n")
                if self.sm:
                    code+=indentglsl(f"{target_var} = smax({target_var}, {tempvar}, {k});\n")
                else:
                    code+=indentglsl(f"{target_var} = max({target_var}, {tempvar});\n")
        code+="}"
        return code

class SmoothIntersect(Intersect):
    """
        ```
        SmoothIntersection(*objlist,k=0.1)
        ```
        generates a smoothed intersection with smoothing factor k
    """
    def __init__(self,*objlist,k=0.1):
        super().__init__(*objlist,sm=True,k=k)


class Subtract(SObject):
    """
    """
    def __init__(self,*objlist,sm=False,k=0.1):
        super().__init__()
        self.children=objlist
        self.sm=sm
        self.k=k

    def gen_glsl(self,pcoord,target_var):
        k = glslfloat(self.k)
        code = "{//Union\n"
        if not self.children:
            return indentglsl(f"{target_var} = 1e9;")
        code+= indentglsl(f"{self.children[0].gen_glsl(pcoord,target_var)};\n")
        tempvar = genvar() 
        if len(self.children)>1:
            code += indentglsl(f"float {tempvar};\n")
            for child in self.children[1:]:
                code+=indentglsl(f"{child.gen_glsl(pcoord,tempvar)};\n")
                if self.sm:
                    code+=indentglsl(f"{target_var} = ssub({target_var}, {tempvar}, {k});\n")
                else:
                    code+=indentglsl(f"{target_var} = sub({target_var}, {tempvar});\n")
        code+="}"
        return code

class SmoothSubtract(Subtract):
    """
        ```
        SmoothIntersection(*objlist,k=0.1)
        ```
        generates a smoothed intersection with smoothing factor k
    """
    def __init__(self,*objlist,k=0.1):
        super().__init__(*objlist,sm=True,k=k)



class Position(SObject):
    """
        ```
        Position(object,mat)
        ```
        Position an object by rotating it and tranlating it
        `mat` is a 4x4 matrix in homogeneous coordinates
        mat can technically be any linear transformation in homogenous coordinates

        Helper functions like `rotx(theta)`, and `translate(x=0,y=0,z=0)`
        are provided to construct it.

        ex `Position(Sphere(1.0),rotx(PI/2) @ translate(z=3))`
        will create a Sphere at the origin , translate it by 3 in z direction and then rotate along x axis by 90
    """
    def __init__(self,sobject,mat):
        print("running Position")
        self.mat = mat
        self.child = sobject

    def gen_glsl(self,pcoord,target_var):
        matinv = np.linalg.inv(self.mat)
        matflatstring = list(glslfloat(m) for m in matinv.flatten('F'))
        neatmatrix = "mat4(\n"
        for (i,num) in enumerate(matflatstring):
            if i!=len(matflatstring)-1:
                neatmatrix += f"{num:>13}, "
            else:
                neatmatrix += f"{num:>13}"
            if i%4==3:
                neatmatrix +="\n"
        neatmatrix+=")"
        newcoord = f"p_{genvar()}"
        matvar = f"m_{genvar()}"
        code = ""
        code += f"mat4 {matvar} = {neatmatrix};\n"
        code += f"vec3 {newcoord} = ({matvar} * vec4({pcoord},1.0)).xyz;\n"
        code += f"{self.child.gen_glsl(newcoord,target_var)};\n" 
        code = indentglsl(code)
        codestart = "{//Position\n"
        code_end = "}"
        return codestart+code+code_end

class Bend(SObject):
    """
        ```
        Bend(object,k=1.0)
        ```
        Bends object upwards along Y axis. `k` typically should be small, large values will distort the sdf too much.
        Since the returned object is not a true sdf , shadows might look a bit off , however this is okay for generating
        stl's
    """
    def __init__(self,sobject,k=1.0):
        self.child = sobject 
        self.k = k
    def gen_glsl(self,p,tr):
        k = glslfloat(self.k)
        matvar = "mat_"+genvar()
        cvar = "c_"+genvar()
        svar = "s_"+genvar()
        qvar = "q_"+genvar()
        code = "{\n"
        code += indentglsl(f"float {cvar} = cos({k}*{p}.x);\n")
        code += indentglsl(f"float {svar} = sin({k}*{p}.x);\n")
        code += indentglsl(f"mat2 {matvar} = mat2({cvar},-{svar},{svar},{cvar});\n")
        code += indentglsl(f"vec3 {qvar} = vec3({matvar}*{p}.xy,{p}.z);\n")
        code += indentglsl(f"{self.child.gen_glsl(qvar,tr)};\n")
        code += "}"
        return code

class Twist(SObject):
    """
        ```
        Twist(object,k=1.0)
        ```
        Twist object upwards along Y axis. large `k` values will distort the sdf.
    """
    def __init__(self,sobject,k=1.0):
        self.child = sobject 
        self.k = k
    def gen_glsl(self,p,tr):
        k = glslfloat(self.k)
        matvar = "mat_"+genvar()
        cvar = "c_"+genvar()
        svar = "s_"+genvar()
        qvar = "q_"+genvar()
        code = "{\n"
        code += indentglsl(f"float {cvar} = cos({k}*{p}.y);\n")
        code += indentglsl(f"float {svar} = sin({k}*{p}.y);\n")
        code += indentglsl(f"mat2 {matvar} = mat2({cvar},-{svar},{svar},{cvar});\n")
        code += indentglsl(f"vec3 {qvar} = vec3({matvar}*{p}.xz,{p}.y);\n")
        code += indentglsl(f"{self.child.gen_glsl(qvar,tr)};\n")
        code += "}"
        return code



def makescenejson():
    """
        returns {'shader':shaderstring} where shaderstring is the Union shader of all objects in scene, used from pyodide to generate the shader 
    """
    retobj = Union(*__all_objects__)
    retshader = "float sdf(vec3 p){\n"
    retshader += indentglsl("float d_final;\n")
    retshader += indentglsl(retobj.gen_glsl('p','d_final'))
    retshader += indentglsl("return d_final;\n")
    retshader += "}"
    print(retshader)
    ret = {'shader':retshader}
    return json.dumps(ret)

def clearobjects():
    global __all_objects__, __all_coords__,coordno,varno
    print("objects and coords cleared")
    __all_objects__ = []
    varno=0

print("pycsg.py loaded")
