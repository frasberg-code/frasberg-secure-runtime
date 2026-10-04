#!/bin/bash

for i in {1..10}
do
  curl -s http://runtime.frasberg.com/health
done
