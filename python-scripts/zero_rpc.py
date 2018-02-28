#!/usr/bin/python2.7

import zerorpc
import secp256k1 # install by typing `pip install secp256k1`

class HelloRPC(object):
    '''pass the method a name, it replies "Hello name!"'''
    def hello(self, name):
    	key_id = bytes(bytearray.fromhex(name))
    	sk = secp256k1.PrivateKey( bytes(bytearray.fromhex('4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7')) )
    	sig_raw = sk.ecdsa_sign_recoverable(key_id, raw=True)
        return ''.join('{:02x}'.format(ord(c)) for c in sig_der[0]) + '{:02x}'.format(sig_der[1])

def main():
    s = zerorpc.Server(HelloRPC())
    s.bind("tcp://*:4242")
    s.run()

if __name__ == "__main__" : main()