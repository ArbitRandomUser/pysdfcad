import inspect
import json
import math
import numpy
print("pycsg.py loaded")

PI = math.pi
coordno=1
varno=1

__all_objects__ = [] #objects are added to this list
__all_coords__ = []

def mat2mulv(A,b):
    [A[0]*b[0]+A[1]*b[1], A[2]*b[0]+A[3]*b[1]]

def gencoord():
    global coordno
    coordno+=1
    return "pcoord"+str(coordno)

def genvar():
    global varno
    varno+=1
    return "var"+str(varno)


def addobject(obj):
    __all_objects__.append(obj);

class SObject:
    def __init__(self):
        self.codeline = inspect.getouterframes(inspect.currentframe())[1].lineno
        self.coord = "pcoord"
    def makejson(self):
        return json.dumps(self.__dict__)

O=[0.0,0.0,0.0]

class Union(SObject):
    def __init__(self,objlist):
        print("running union")
        super().__init__()
        self.children = objlist
        self.shader = ""
        for obj in objlist[:-1]:
            self.shader = self.shader + f"min({obj.shader},"
        self.shader = self.shader + f"{objlist[-1].shader}"+")"*(len(objlist)-1)
        self.shader = self.shader + ""
        print(self.shader)

class Sphere(SObject):
    def __init__(self,radius,center=O):
        print("running sphere")
        super().__init__()
        self.center = center
        self.radius= radius
        self.shader = f"sphere(pcoord,vec3{center[0],center[1],center[2]},{radius})"

class Elongate(SObject):
    """
    `Elongate(SObject,h:vec3)`
    elongate the object. Think of it as introducing a "slice"  of the object at the origin
    and the elongating this slice.
    """
    #TODO use other implementation from ig's page .
    def __init__(self,sobject,h):
        print("running Extrude")
        super().__init__()
        hh = f"vec3({h[0]},{h[1]},{h[2]})"
        newcoord = gencoord()
        oldcoord = sobject.coord
        self.coord = newcoord
        coordtransform = f"""vec3 {newcoord} = {oldcoord} - clamp({oldcoord},-{hh},{hh});"""
        __all_coords__.append(coordtransform)
        self.shader = sobject.shader.replace(oldcoord,newcoord)

def rotx(angle_rad):
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

def roty(angle_rad):
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

def rotz(angle_rad):
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

def translation(x=0, y=0, z=0):
    """ Creates a 4x4 translation matrix. """
    return np.array([
        [1, 0, 0, x],
        [0, 1, 0, y],
        [0, 0, 1, z],
        [0, 0, 0,  1]
    ], dtype=np.float32)


class Position(SObject):
    """
        Position an object by rotating it and tranlating it
        `affinemat` is a 4x4 matrix in homogeneous coordinates
        helper functions like `rotx(theta)`, and `translate(x=0,y=0,z=0)`
        are provided to construct it.
        ex `Position(Sphere(1.0),rotx(PI/2) @ translate(z=3))`
        will create a Sphere at the origin , tranlate it by 3 in z direction and then rotate along x axis by 90
    """
    def __init__(self,sobject,affinemat):
        print("running Rotate")



class Twist(SObject):
    def __init__(self,sobject,p,k=10.0):
        c = cos(k*p[1]);
        s = sin(k*p[1]);

class RoundBox(SObject):
    def __init__(self,dims,r):
        self.dims = dims
        self.r = r
        self.shader = f"roundbox(pcoord,vec3{dims[0],dims[1],dims[2]},{r})"

def makescenejson():
    """
        objlist is list of objects, shader is assembled in javascript
        coordshaderstring is a bit of shader code that contains calculations of pcoords#n 
    """
    objlist = []
    for obj in __all_objects__:
        objlist.append(obj.makejson())
    coordshaderstring = "".join(__all_coords__)
    ret = {"objects":objlist,"pcoords":coordshaderstring}
    return json.dumps(ret)

def clearobjects():
    global __all_objects__, __all_coords__,coordno,varno
    print("objects and coords cleared")
    __all_objects__ = []
    __all_coords__ = []
    coordno=0
    varno=0
